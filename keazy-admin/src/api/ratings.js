/**
 * Ratings API Module
 * Handles provider rating submissions and retrieval
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000';

/**
 * Submit a rating for a provider
 * @param {string} bookingId - Booking ID
 * @param {string} providerId - Provider ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Optional comment
 * @returns {Promise} Response from backend
 */
export const addRating = async (bookingId, providerId, rating, comment = '') => {
  try {
    const response = await axios.post(`${API_BASE}/ratings/add`, {
      booking_id: bookingId,
      provider_id: providerId,
      rating: parseInt(rating),
      comment: comment || ''
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

/**
 * Get all ratings for a provider
 * @param {string} providerId - Provider ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 10)
 * @returns {Promise} Response with ratings and statistics
 */
export const getProviderRatings = async (providerId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE}/ratings/provider/${providerId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching provider ratings:', error);
    throw error;
  }
};

/**
 * Get rating statistics for a provider
 * @param {string} providerId - Provider ID
 * @returns {Promise} Response with stats (average, distribution)
 */
export const getRatingStats = async (providerId) => {
  try {
    const response = await axios.get(`${API_BASE}/ratings/provider/${providerId}`, {
      params: { limit: 1 }
    });
    return response.data.stats;
  } catch (error) {
    console.error('Error fetching rating statistics:', error);
    throw error;
  }
};
