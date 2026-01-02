import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { addRating } from '../api/ratings';

/**
 * RatingDialog Component
 * Allows users to rate a provider after booking completion
 * 
 * Props:
 * - open: boolean - Whether dialog is open
 * - onClose: function - Callback when dialog closes
 * - booking: object - Booking details { _id, provider_id, provider_name }
 * - onSuccess: function - Callback after successful rating submission
 */
const RatingDialog = ({ open, onClose, booking, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addRating(booking._id, booking.provider_id, rating, comment);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rate {booking.provider_name}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Rating submitted successfully!
          </Alert>
        )}

        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 1, fontSize: '14px', color: '#666' }}>
            How would you rate this provider?
          </Box>
          <Rating
            size="large"
            value={rating}
            onChange={(e, newValue) => setRating(newValue)}
            disabled={loading || success}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Comment (optional)"
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading || success}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || success || rating < 1}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingDialog;
