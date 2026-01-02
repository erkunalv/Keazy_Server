/**
 * @fileoverview Query Processing Router
 * 
 * This module handles the core query processing pipeline:
 * 1. User tracking and auto-creation
 * 2. Two-phase service detection (rule-based + ML fallback)
 * 3. Hierarchical provider matching (state → city → geolocation radius)
 * 4. Slot aggregation per provider
 * 5. Booking and cancellation operations
 * 
 * @module routes/query
 */

const express = require("express");
const router = express.Router();
const { normalizeService } = require("../services/entities");
const { detectUrgency } = require("../services/urgency");
const { getIntentPrediction } = require("../services/intentModel");
const { matchProviders } = require("../services/matcher");
const Query = require("../models/query");
const Provider = require("../models/provider");
const Slot = require("../models/slot");
const User = require("../models/user");
const logger = require("../utils/logger"); // Winston logger

/**
 * Builds structured business cards for providers with their available slots.
 * Each card contains provider details and up to 5 upcoming available slots.
 * 
 * @async
 * @param {Array<Object>} providers - Array of provider documents from MongoDB
 * @param {string} providers[].provider_id - Unique provider identifier
 * @param {string} providers[].name - Provider display name
 * @param {string} providers[].service - Service type (e.g., "electrician")
 * @param {string} providers[].contact - Phone number
 * @param {string} providers[].city - City location
 * @param {string} providers[].state - State location
 * @param {number} providers[].rating - Rating (0-5)
 * @param {number} [providers[].distance_m] - Distance in meters (from geo search)
 * @returns {Promise<Array<Object>>} Array of business cards with embedded slots
 * 
 * @example
 * // Returns:
 * // [{
 * //   provider_id: "P001",
 * //   name: "ABC Electric",
 * //   distance_km: 2.5,
 * //   next_available_slots: [{ slot_id: "...", date: "2026-01-01", time: "09:00" }]
 * // }]
 */
async function buildBusinessCards(providers) {
  const cards = [];
  
  // Get today's date in YYYY-MM-DD format for slot filtering
  const today = new Date().toISOString().split('T')[0];
  
  for (const provider of providers) {
    // Query available slots for this provider, starting from today
    // Sort by date and time ascending to get earliest slots first
    const slots = await Slot.find({
      provider_id: provider._id,
      available: true,
      date: { $gte: today }
    })
    .sort({ date: 1, time: 1 })
    .limit(5)  // Max 5 slots per provider
    .lean();

    // Build card object
    const card = {
      // Provider identification
      provider_id: provider.provider_id,
      name: provider.name,
      service: provider.service,
      contact: provider.contact,
      location: {
        city: provider.city,
        state: provider.state,
        area: provider.area
      },
      // Credibility and availability signals for ranking UI
      rating: provider.rating,
      verified: provider.verified,
      available_now: provider.available_now,
      response_time_min: provider.response_time_min,
      hourly_rate: provider.hourly_rate,
      // Available booking slots with IDs for direct booking
      next_available_slots: slots.map(s => ({
        slot_id: s._id,
        date: s.date,
        time: s.time,
        duration_min: s.duration_min
      }))
    };

    // Add distance if available (from geo search)
    if (provider.distance_m !== undefined) {
      card.distance_km = Math.round(provider.distance_m / 10) / 100; // Convert to km with 2 decimals
    }

    cards.push(card);
  }
  
  return cards;
}

/**
 * POST /query - Main query processing endpoint
 * 
 * Pipeline Steps:
 * 1. Validate input (query_text, user_id required)
 * 2. Track user via upsert (auto-create if new)
 * 3. Rule-based service matching (DB synonyms with 5-min cache)
 * 4. ML fallback if rules fail (TF-IDF + LogisticRegression)
 * 5. Provider lookup using hierarchical geo search (state → city → radius)
 * 6. Slot aggregation for each provider
 * 7. Log query with latency metrics
 * 
 * @route POST /query
 * @param {Object} req.body - Request body
 * @param {string} req.body.user_id - Unique user identifier (required)
 * @param {string} req.body.query_text - Natural language query (required)
 * @param {string} [req.body.state] - User's state for provider matching
 * @param {string} [req.body.city] - User's city for provider matching
 * @param {string} [req.body.location] - Alias for city field
 * @param {string} [req.body.area] - User's area for scoring bonus
 * @param {number} [req.body.lat] - User's latitude for geo search
 * @param {number} [req.body.lng] - User's longitude for geo search
 * @param {number} [req.body.radius_km] - Search radius in km (default: 10)
 * @returns {Object} 200 - Query result with business cards
 * @returns {Object} 400 - Missing required fields
 * @returns {Object} 500 - Server error
 */
router.post("/", async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info("Incoming /query request", { body: req.body });

    const { user_id, query_text, location, city, state, area, lat, lng, radius_km } = req.body;
    const userCity = city || location; // Support both field names for compatibility
    
    // Validate required fields
    if (!query_text) {
      logger.warn("Missing query_text");
      return res.status(400).json({ error: "query_text required" });
    }
    if (!user_id) {
      logger.warn("Missing user_id");
      return res.status(400).json({ error: "user_id required" });
    }

    // ------------------------------------------------------------------
    // STEP 1: User Tracking
    // Upsert user record, increment query counter, update last_query_at
    // Auto-creates user if first-time query
    // ------------------------------------------------------------------
    logger.info("Tracking user", { user_id });
    const user = await User.recordQuery(user_id, userCity);
    logger.info("User tracked", { user_id, total_queries: user.total_queries });

    // ------------------------------------------------------------------
    // STEP 2: Rule-Based Service Detection (Fast Path)
    // Uses DB-backed synonyms with 5-minute cache
    // Falls back to JSON file if DB unavailable
    // ------------------------------------------------------------------
    logger.info("Step 1: Normalizing service");
    let service = await normalizeService(query_text);
    let source = "rule";
    let confidence = service ? 0.95 : 0;  // Rule-based = 95% confidence

    // ------------------------------------------------------------------
    // STEP 3: ML Fallback (if rules fail)
    // Calls Python ML service for TF-IDF + LogisticRegression prediction
    // ------------------------------------------------------------------
    if (!service) {
      logger.info("Step 2: Rule failed, falling back to ML");
      const urgency = detectUrgency(query_text);
      try {
        const mlResult = await getIntentPrediction(query_text, urgency);
        logger.info("ML result", mlResult);
        service = mlResult?.predicted_service;
        confidence = mlResult?.confidence || 0.5;
        source = "ml";
      } catch (err) {
        logger.error("ML prediction failed", { error: err.message, stack: err.stack });
        return res.status(500).json({ error: "ML prediction failed" });
      }
    }

    // No service detected by either method
    if (!service) {
      logger.warn("No service detected");
      return res.status(400).json({ error: "Could not detect service" });
    }

    // ------------------------------------------------------------------
    // STEP 4: Provider Matching (Hierarchical Geo Search)
    // Filters providers using: State → City → Geolocation Radius
    // Ranks by: distance (if geo) + rating + availability + verification
    // Falls back to broader search if no providers found
    // ------------------------------------------------------------------
    logger.info("Step 3: Looking up providers", { 
      service, 
      state, 
      city: userCity, 
      area,
      geo: lat && lng ? { lat, lng, radius_km } : null 
    });
    
    // Build geo params if coordinates provided
    const geoParams = (lat && lng) ? { lat, lng, radiusKm: radius_km || 10 } : null;
    
    // Use hierarchical matcher
    let matchResult = await matchProviders({
      intent: service,
      state,
      city: userCity,
      area,
      geo: geoParams,
      limit: 5
    });
    
    let providers = matchResult.providers;
    let searchMethod = matchResult.searchMethod;
    
    // Fallback: If no providers found with filters, broaden search
    if (providers.length === 0) {
      logger.info("No providers with filters, broadening search");
      
      // Try without geo first
      if (geoParams) {
        matchResult = await matchProviders({
          intent: service,
          state,
          city: userCity,
          limit: 5
        });
        providers = matchResult.providers;
        searchMethod = 'fallback-no-geo';
      }
      
      // Try without city
      if (providers.length === 0 && userCity) {
        matchResult = await matchProviders({
          intent: service,
          state,
          limit: 5
        });
        providers = matchResult.providers;
        searchMethod = 'fallback-state-only';
      }
      
      // Try service only
      if (providers.length === 0) {
        matchResult = await matchProviders({
          intent: service,
          limit: 5
        });
        providers = matchResult.providers;
        searchMethod = 'fallback-service-only';
      }
    }
    
    logger.info("Providers found", { count: providers.length, searchMethod });

    // ------------------------------------------------------------------
    // STEP 5: Slot Aggregation
    // Build business cards with embedded available slots for each provider
    // ------------------------------------------------------------------
    logger.info("Step 4: Building business cards");
    const businessCards = await buildBusinessCards(providers);

    // ------------------------------------------------------------------
    // STEP 6: Query Logging
    // Persist query details with latency metrics for analytics/training
    // ------------------------------------------------------------------
    const latency_ms = Date.now() - startTime;
    logger.info("Step 5: Logging query to DB");
    
    const urgency = detectUrgency(query_text);
    const logEntry = await Query.create({
      user_id,
      query_text,
      normalized_service: service,
      location: userCity,
      urgency,
      confidence,
      latency_ms,
      matched_providers: providers.map(p => p._id),
      source,
      timestamp: new Date()
    });
    logger.info("Query logged", { log_id: logEntry._id, latency_ms });

    // ------------------------------------------------------------------
    // Response Structure
    // Designed for voice-ready consumption with business cards
    // ------------------------------------------------------------------
    res.json({
      success: true,
      query: {
        text: query_text,
        detected_service: service,
        confidence: Math.round(confidence * 100),  // Convert to percentage
        source,  // "rule" or "ml"
        urgency  // "low", "normal", or "high"
      },
      location: {
        state: state || null,
        city: userCity || null,
        area: area || null,
        geo: geoParams ? { lat, lng, radius_km: radius_km || 10 } : null,
        search_method: searchMethod
      },
      business_cards: businessCards,
      meta: {
        total_providers: businessCards.length,
        log_id: logEntry._id,
        latency_ms,
        user_queries: user.total_queries
      }
    });
  } catch (err) {
    logger.error("Error in /query route", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /query/book - Book a slot
 * 
 * Atomically updates slot status and records user booking.
 * Uses findOneAndUpdate with conditions to prevent race conditions.
 * 
 * @route POST /query/book
 * @param {Object} req.body - Request body
 * @param {string} req.body.user_id - User making the booking
 * @param {string} req.body.slot_id - Slot ObjectId to book
 * @param {string} [req.body.notes] - Optional booking notes
 * @returns {Object} 200 - Booking confirmation with slot details
 * @returns {Object} 400 - Slot unavailable or already booked
 */
router.post("/book", async (req, res) => {
  try {
    logger.info("Incoming /query/book request", { body: req.body });
    
    const { user_id, slot_id, notes } = req.body;
    
    if (!user_id || !slot_id) {
      return res.status(400).json({ error: "user_id and slot_id required" });
    }
    
    // Atomic slot booking - prevents double-booking
    const bookedSlot = await Slot.bookSlot(slot_id, user_id, notes);
    
    if (!bookedSlot) {
      return res.status(400).json({ error: "Slot not available or already booked" });
    }
    
    // Update user's booking statistics
    await User.recordBooking(user_id);
    
    logger.info("Slot booked", { slot_id, user_id });
    
    res.json({
      success: true,
      booking: {
        slot_id: bookedSlot._id,
        provider: bookedSlot.provider_id?.name || 'Unknown',
        service: bookedSlot.service_name,
        date: bookedSlot.date,
        time: bookedSlot.time,
        status: bookedSlot.status
      }
    });
  } catch (err) {
    logger.error("Error in /query/book route", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /query/cancel - Cancel a booking
 * 
 * Restores slot availability and resets booking metadata.
 * Only allows cancellation by the user who made the booking.
 * 
 * @route POST /query/cancel
 * @param {Object} req.body - Request body
 * @param {string} req.body.user_id - User requesting cancellation
 * @param {string} req.body.slot_id - Slot ObjectId to cancel
 * @returns {Object} 200 - Cancellation confirmation
 * @returns {Object} 400 - Booking not found or unauthorized
 */
router.post("/cancel", async (req, res) => {
  try {
    logger.info("Incoming /query/cancel request", { body: req.body });
    
    const { user_id, slot_id } = req.body;
    
    if (!user_id || !slot_id) {
      return res.status(400).json({ error: "user_id and slot_id required" });
    }
    
    // Atomic cancellation - only if booked by this user
    const cancelledSlot = await Slot.cancelBooking(slot_id, user_id);
    
    if (!cancelledSlot) {
      return res.status(400).json({ error: "Booking not found or cannot be cancelled" });
    }
    
    logger.info("Booking cancelled", { slot_id, user_id });
    
    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });
  } catch (err) {
    logger.error("Error in /query/cancel route", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /query/bookings/:user_id - Get user's bookings
 * 
 * Retrieves all slots booked by a user with provider details.
 * Populates provider reference for contact and location info.
 * 
 * @route GET /query/bookings/:user_id
 * @param {string} req.params.user_id - User identifier
 * @returns {Object} 200 - Array of booking objects with provider info
 */
router.get("/bookings/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Fetch all slots booked by user, populate provider details
    const bookings = await Slot.find({ booked_by: user_id })
      .populate('provider_id', 'name contact city area')  // Only select needed fields
      .sort({ date: 1, time: 1 })
      .lean();
    
    // Transform to client-friendly format
    res.json({
      success: true,
      bookings: bookings.map(b => ({
        slot_id: b._id,
        provider: b.provider_id?.name,
        contact: b.provider_id?.contact,
        location: `${b.provider_id?.area}, ${b.provider_id?.city}`,
        service: b.service_name,
        date: b.date,
        time: b.time,
        status: b.status,
        booked_at: b.booked_at
      }))
    });
  } catch (err) {
    logger.error("Error fetching bookings", { message: err.message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /query/feedback - Submit feedback on prediction
 * 
 * Records user feedback for ML model improvement.
 * Linked to specific query log via log_id.
 * 
 * @route POST /query/feedback
 * @param {Object} req.body - Request body
 * @param {string} req.body.log_id - Query log ObjectId
 * @param {string} req.body.feedback - User feedback text
 * @returns {Object} 200 - Feedback recorded confirmation
 */
router.post("/feedback", async (req, res) => {
  try {
    logger.info("Incoming /query/feedback request", { body: req.body });
    const { log_id, feedback } = req.body;
    
    if (!log_id || !feedback) {
      logger.warn("Missing log_id or feedback");
      return res.status(400).json({ error: "log_id and feedback required" });
    }

    // Update query log with feedback metadata
    const update = { user_feedback: feedback, feedback_at: new Date() };
    const result = await Query.findByIdAndUpdate(log_id, update, { new: true });
    logger.info("Feedback saved", { log_id, updated: !!result });

    res.json({ status: "ok", log_id, feedback, updated: result ? 1 : 0 });
  } catch (err) {
    logger.error("Error saving feedback", { message: err.message, stack: err.stack });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
