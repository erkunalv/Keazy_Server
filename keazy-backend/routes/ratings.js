const express = require('express');
const Rating = require('../models/rating');
const Provider = require('../models/provider');
const logger = require('../utils/logger');
const router = express.Router();

/**
 * ✅ Add new rating
 * POST /ratings/add
 * Body: { booking_id, provider_id, rating, comment }
 */
router.post('/add', async (req, res, next) => {
  try {
    const { booking_id, provider_id, rating, comment = '' } = req.body;

    // Validate required fields
    if (!booking_id || !provider_id || rating === undefined) {
      logger.warn('Rating submission failed: missing required fields', {
        booking_id, provider_id, rating
      });
      return res.status(400).json({
        error: 'booking_id, provider_id, and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      logger.warn('Rating submission failed: invalid rating value', { rating });
      return res.status(400).json({
        error: 'rating must be an integer between 1 and 5'
      });
    }

    // Create rating
    const newRating = new Rating({
      booking_id,
      provider_id,
      rating: Number(rating),
      comment: comment || '',
      created_at: new Date()
    });

    const savedRating = await newRating.save();

    // Update provider's average rating
    const allRatings = await Rating.find({ provider_id });
    if (allRatings.length > 0) {
      const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      await Provider.findByIdAndUpdate(provider_id, { rating: avgRating });
    }

    logger.info('Rating submitted successfully', {
      rating_id: savedRating._id,
      provider_id,
      rating: savedRating.rating
    });

    res.status(201).json({
      rating_id: savedRating._id,
      status: 'submitted',
      message: 'Rating submitted successfully'
    });
  } catch (err) {
    logger.error('Rating submission error', { error: err.message });
    next(err);
  }
});

/**
 * ✅ Get ratings for a provider
 * GET /ratings/provider/:provider_id
 */
router.get('/provider/:provider_id', async (req, res, next) => {
  try {
    const { provider_id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const ratings = await Rating.find({ provider_id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Rating.countDocuments({ provider_id });

    // Calculate statistics
    const allRatings = await Rating.find({ provider_id }).lean();
    const stats = {
      total_ratings: total,
      average_rating: allRatings.length > 0
        ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(2)
        : 0,
      distribution: {
        1: allRatings.filter(r => r.rating === 1).length,
        2: allRatings.filter(r => r.rating === 2).length,
        3: allRatings.filter(r => r.rating === 3).length,
        4: allRatings.filter(r => r.rating === 4).length,
        5: allRatings.filter(r => r.rating === 5).length
      }
    };

    res.json({
      ratings,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    logger.error('Error fetching provider ratings', {
      error: err.message,
      provider_id: req.params.provider_id
    });
    next(err);
  }
});

module.exports = router;
