/**
 * @fileoverview PredictPage - Query Testing & Booking Interface
 * 
 * This page allows testing the query processing pipeline with:
 * - Natural language query input (simulating voice input)
 * - City and urgency selection
 * - Auto-generated user ID tracking
 * - Service detection results display
 * - Provider business cards with ratings/availability
 * - Slot booking with confirmation dialog
 * 
 * Flow:
 * 1. User enters query text → handleSubmit() → POST /query
 * 2. Results displayed as business cards with clickable slots
 * 3. User clicks slot → opens booking dialog
 * 4. Confirm → handleBookSlot() → POST /query/book
 * 5. Slot removed from results, added to "Your Bookings"
 * 
 * @module pages/PredictPage
 */

import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useToast } from "../providers/ToastProvider";

export default function PredictPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /** @state {string} queryText - User's natural language query */
  const [queryText, setQueryText] = useState("");
  
  /** @state {string} urgency - Query urgency level: "low" | "normal" | "high" */
  const [urgency, setUrgency] = useState("normal");
  
  /** @state {string} city - Target city for provider matching */
  const [city, setCity] = useState("Aligarh");
  
  /** @state {string} userId - Auto-generated user identifier */
  const [userId, setUserId] = useState("user-" + Math.random().toString(36).substr(2, 9));
  
  /** @state {boolean} loading - Query submission in progress */
  const [loading, setLoading] = useState(false);
  
  /** @state {Object|null} result - API response containing business cards */
  const [result, setResult] = useState(null);
  
  /** @state {string|null} error - Error message from API */
  const [error, setError] = useState(null);
  
  /** @state {Object|null} bookingSlot - Selected slot for booking confirmation */
  const [bookingSlot, setBookingSlot] = useState(null); // { slot, provider, contact }
  
  /** @state {boolean} bookingLoading - Booking request in progress */
  const [bookingLoading, setBookingLoading] = useState(false);
  
  /** @state {Array} bookings - User's confirmed bookings this session */
  const [bookings, setBookings] = useState([]);
  
  const toast = useToast();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Submits query to backend for service detection and provider matching.
   * 
   * API Call: POST /query
   * Request: { query_text, urgency, user_id, city }
   * Response: { query, business_cards, meta }
   * 
   * @async
   * @returns {void}
   */
  const handleSubmit = async () => {
    if (!queryText.trim()) {
      toast.show("Please enter a query", "warning");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch(`${import.meta.env.VITE_API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: queryText,
          urgency: urgency,
          user_id: userId,
          city: city,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process query: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      toast.show("Query processed successfully", "success");
    } catch (err) {
      console.error("Query error:", err);
      setError(err.message);
      toast.show("Failed to process query", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirms slot booking from the booking dialog.
   * 
   * API Call: POST /query/book
   * Request: { user_id, slot_id, notes }
   * Response: { success, booking }
   * 
   * On success:
   * - Adds booking to local bookings array
   * - Removes booked slot from business cards display
   * - Closes booking dialog
   * 
   * @async
   * @returns {void}
   */
  const handleBookSlot = async () => {
    if (!bookingSlot) return;
    
    try {
      setBookingLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/query/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          slot_id: bookingSlot.slot.slot_id,
          notes: `Booked via voice query: ${queryText}`,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Booking failed");
      }

      toast.show(`✅ Booked with ${bookingSlot.provider} on ${bookingSlot.slot.date} at ${bookingSlot.slot.time}`, "success");
      setBookings([...bookings, data.booking]);
      setBookingSlot(null);
      
      // Remove booked slot from results to prevent double-booking
      if (result) {
        const updatedCards = result.business_cards.map(card => ({
          ...card,
          next_available_slots: card.next_available_slots.filter(s => s.slot_id !== bookingSlot.slot.slot_id)
        }));
        setResult({ ...result, business_cards: updatedCards });
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.show(err.message || "Failed to book slot", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  /**
   * Resets form to initial state.
   * @returns {void}
   */
  const handleClear = () => {
    setQueryText("");
    setResult(null);
    setError(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={{ padding: "24px" }}>
      <Typography variant="h4" gutterBottom>
        🎤 Voice Query Simulator
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Simulate a user's voice query to see business cards returned
      </Typography>

      {/* -------------------------------------------------------------------- */}
      {/* INPUT SECTION - Query text, city, urgency, user ID selection */}
      {/* -------------------------------------------------------------------- */}
      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Voice Query (what the user says)"
            multiline
            rows={2}
            fullWidth
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="e.g., 'need a plumber tomorrow', 'fix my fan urgently', 'I need medicine for headache'..."
            variant="outlined"
            disabled={loading}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>City</InputLabel>
              <Select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                label="City"
                disabled={loading}
              >
                <MenuItem value="Aligarh">Aligarh</MenuItem>
                <MenuItem value="Delhi">Delhi</MenuItem>
                <MenuItem value="Lucknow">Lucknow</MenuItem>
                <MenuItem value="">Any City</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Urgency</InputLabel>
              <Select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                label="Urgency"
                disabled={loading}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="User ID"
              fullWidth
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              variant="outlined"
              disabled={loading}
              size="small"
            />

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !queryText.trim()}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "🔍 Find Services"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

          {/* -------------------------------------------------------------------- */}
          {/* ERROR DISPLAY - API error messages */}
          {/* -------------------------------------------------------------------- */}
          {error && (
            <Alert severity="error" sx={{ marginBottom: 3 }}>
              <strong>Error:</strong> {error}
            </Alert>
          )}

          {/* -------------------------------------------------------------------- */}
          {/* RESULT SECTION - Query understanding + Business cards */}
          {/* -------------------------------------------------------------------- */}
          {result && (
            <Paper sx={{ padding: 3 }}>
              {/* Query Understanding Summary */}
              <Typography variant="h6" gutterBottom>
                🧠 Query Understanding
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 3 }}>
                {/* Detected service chip */}
                <Chip 
                  label={`Service: ${result.query?.detected_service}`} 
                  color="primary" 
                  sx={{ textTransform: "capitalize", fontSize: "1rem", padding: "8px" }}
                />
                {/* Confidence indicator with color based on threshold */}
                <Chip 
                  label={`Confidence: ${result.query?.confidence}%`} 
                  color={result.query?.confidence > 80 ? "success" : "warning"}
                />
                {/* Source indicator: "rule" (keyword) or "ml" (model) */}
                <Chip 
                  label={`Source: ${result.query?.source}`} 
                  variant="outlined"
                  sx={{ textTransform: "uppercase" }}
                />
                {/* Urgency level */}
                <Chip 
                  label={`Urgency: ${result.query?.urgency}`} 
                  color={result.query?.urgency === "high" ? "error" : "default"}
                />
                {/* API latency for performance monitoring */}
                <Chip 
                  label={`Latency: ${result.meta?.latency_ms}ms`} 
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Divider sx={{ marginBottom: 3 }} />

              {/* ---------------------------------------------------------------- */}
              {/* BUSINESS CARDS - Provider cards with booking capability */}
              {/* ---------------------------------------------------------------- */}
              <Typography variant="h6" gutterBottom>
                📇 Business Cards ({result.business_cards?.length || 0} providers found)
              </Typography>
          
          {result.business_cards && result.business_cards.length > 0 ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2, marginBottom: 3 }}>
              {result.business_cards.map((card, index) => (
                <Card key={card.provider_id || index} sx={{ border: card.verified ? "2px solid #4caf50" : "1px solid #ddd" }}>
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {card.name}
                      </Typography>
                      {card.verified && (
                        <Chip label="✓ Verified" size="small" color="success" />
                      )}
                    </Box>
                    
                    {/* Service & Rating */}
                    <Box sx={{ display: "flex", gap: 1, marginBottom: 1 }}>
                      <Chip label={card.service} size="small" sx={{ textTransform: "capitalize" }} />
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                        ⭐ {card.rating}/5
                      </Typography>
                    </Box>

                    {/* Contact */}
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: "primary.main", marginBottom: 1 }}>
                      📞 {card.contact}
                    </Typography>

                    {/* Location */}
                    <Typography variant="body2" color="textSecondary">
                      📍 {card.location?.area}, {card.location?.city}
                    </Typography>

                    {/* Stats Row */}
                    <Box sx={{ display: "flex", gap: 2, marginTop: 1, marginBottom: 1 }}>
                      <Typography variant="body2">
                        ⏱️ {card.response_time_min} min response
                      </Typography>
                      {card.hourly_rate > 0 && (
                        <Typography variant="body2">
                          💰 ₹{card.hourly_rate}/hr
                        </Typography>
                      )}
                    </Box>

                    {/* Availability */}
                    <Chip 
                      label={card.available_now ? "🟢 Available Now" : "🔴 Busy"} 
                      size="small" 
                      color={card.available_now ? "success" : "default"}
                      variant="outlined"
                      sx={{ marginBottom: 1 }}
                    />

                    {/* Next Available Slots - Now Bookable */}
                    {card.next_available_slots && card.next_available_slots.length > 0 && (
                      <Box sx={{ marginTop: 1 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          📅 Available slots (click to book):
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {card.next_available_slots.slice(0, 5).map((slot, i) => (
                            <Chip 
                              key={slot.slot_id || i}
                              label={`${slot.date} ${slot.time}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              clickable
                              onClick={() => setBookingSlot({ slot, provider: card.name, contact: card.contact })}
                              sx={{ fontSize: "0.7rem", cursor: "pointer", '&:hover': { backgroundColor: 'primary.light', color: 'white' } }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Alert severity="info" sx={{ marginBottom: 3 }}>
              No providers found for this service in the selected city. Try a different city or service.
            </Alert>
          )}

          {/* Full Response JSON (collapsible) */}
          <Box sx={{ marginTop: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="textSecondary">
              📋 Raw API Response (for debugging):
            </Typography>
            <Paper
              sx={{
                padding: 2,
                backgroundColor: "#f5f5f5",
                overflow: "auto",
                maxHeight: 200,
              }}
            >
              <pre style={{ margin: 0, fontSize: "0.75rem" }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </Paper>
          </Box>
        </Paper>
      )}

      {/* Your Bookings Section */}
      {bookings.length > 0 && (
        <Paper sx={{ padding: 3, marginTop: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎫 Your Bookings ({bookings.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {bookings.map((booking, i) => (
              <Card key={booking.slot_id || i} sx={{ minWidth: 250, backgroundColor: "#e8f5e9" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    ✅ {booking.provider}
                  </Typography>
                  <Typography variant="body2">{booking.service}</Typography>
                  <Typography variant="body2">📅 {booking.date} at {booking.time}</Typography>
                  <Chip label={booking.status} size="small" color="success" sx={{ marginTop: 1 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Empty State */}
      {!result && !error && !loading && (
        <Paper sx={{ padding: 3, textAlign: "center", color: "textSecondary" }}>
          <Typography>
            Enter a query above and click "Find Services" to get started
          </Typography>
        </Paper>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog open={!!bookingSlot} onClose={() => setBookingSlot(null)}>
        <DialogTitle>📅 Confirm Booking</DialogTitle>
        <DialogContent>
          {bookingSlot && (
            <Box sx={{ minWidth: 300, paddingTop: 1 }}>
              <Typography variant="h6">{bookingSlot.provider}</Typography>
              <Typography variant="body1" sx={{ marginTop: 1 }}>
                📞 {bookingSlot.contact}
              </Typography>
              <Divider sx={{ marginY: 2 }} />
              <Typography variant="body1">
                <strong>Date:</strong> {bookingSlot.slot.date}
              </Typography>
              <Typography variant="body1">
                <strong>Time:</strong> {bookingSlot.slot.time}
              </Typography>
              <Typography variant="body1">
                <strong>Duration:</strong> {bookingSlot.slot.duration_min} minutes
              </Typography>
              <Alert severity="info" sx={{ marginTop: 2 }}>
                Booking as: <strong>{userId}</strong>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingSlot(null)} disabled={bookingLoading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleBookSlot}
            disabled={bookingLoading}
          >
            {bookingLoading ? <CircularProgress size={20} /> : "Confirm Booking"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
