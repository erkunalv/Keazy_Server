import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Rating,
  CircularProgress,
  Alert,
  Chip,
  Typography
} from '@mui/material';
import { Add as AddIcon, PlayArrow as PlayArrowIcon, Info as InfoIcon } from '@mui/icons-material';

const API_BASE = 'http://localhost:3000';

/**
 * ProvidersPage Component
 * Displays registered providers with registration and simulation capabilities
 */
const ProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    service: '',
    contact: '',
    slots: '',
    voice_intro: ''
  });

  // Fetch providers on component mount and page change
  useEffect(() => {
    fetchProviders();
  }, [page]);

  const fetchProviders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/providers`, {
        params: { page, limit: 10 }
      });
      setProviders(response.data.providers);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError('Failed to fetch providers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOpen = () => {
    setFormData({
      name: '',
      service: '',
      contact: '',
      slots: '',
      voice_intro: ''
    });
    setOpenRegisterDialog(true);
  };

  const handleRegisterClose = () => {
    setOpenRegisterDialog(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterSubmit = async () => {
    const { name, service, contact, slots, voice_intro } = formData;

    if (!name || !service || !contact) {
      setError('Name, service, and contact are required');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      const payload = {
        name,
        service,
        contact,
        slots: slots ? [slots] : [],
        voice_intro
      };

      const response = await axios.post(`${API_BASE}/providers/register`, payload);
      setSuccessMessage(`Provider "${name}" registered successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchProviders();
      handleRegisterClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register provider');
    } finally {
      setRegistering(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setError('');

    try {
      // Call the registration simulator endpoint on backend
      // Note: You need to add a POST /simulate/provider-registration endpoint
      const response = await axios.post(`${API_BASE}/simulators/provider-registration`, {
        count: 5
      });

      setSuccessMessage(`${response.data.successCount} providers simulated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchProviders();
    } catch (err) {
      // If endpoint doesn't exist, show instructional message
      if (err.response?.status === 404) {
        setError('Simulator endpoint not yet configured. Run: node keazy-backend/simulators/providerRegistrationSimulator.js');
      } else {
        setError(err.response?.data?.error || 'Failed to simulate providers');
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleViewDetails = async (provider) => {
    setSelectedProvider(provider);
    setOpenDetailsDialog(true);
  };

  const handleDetailsClose = () => {
    setOpenDetailsDialog(false);
    setSelectedProvider(null);
  };

  if (loading && providers.length === 0) {
    return (
      <Container sx={{ pt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          📋 Provider Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleRegisterOpen}
          >
            Register Provider
          </Button>
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleSimulate}
            disabled={simulating}
          >
            {simulating ? 'Simulating...' : 'Simulate Registrations'}
          </Button>
        </Box>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Total Providers: <strong>{total}</strong>
        </Typography>
      </Box>

      {/* Providers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Service</strong></TableCell>
              <TableCell><strong>Contact</strong></TableCell>
              <TableCell align="center"><strong>Rating</strong></TableCell>
              <TableCell align="center"><strong>Slots</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {providers.map((provider) => (
              <TableRow key={provider._id} hover>
                <TableCell>{provider.name}</TableCell>
                <TableCell>
                  <Chip label={provider.service} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{provider.contact}</TableCell>
                <TableCell align="center">
                  {provider.rating > 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Rating value={provider.rating} readOnly size="small" />
                      <Typography variant="caption">({provider.rating.toFixed(1)})</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">No ratings</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {provider.slots?.length || 0}
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<InfoIcon />}
                    onClick={() => handleViewDetails(provider)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Provider Details Dialog */}
      {selectedProvider && (
        <Dialog open={openDetailsDialog} onClose={handleDetailsClose} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedProvider.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Service</Typography>
                  <Typography variant="body2">{selectedProvider.service}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Contact</Typography>
                  <Typography variant="body2">{selectedProvider.contact}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Rating</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Rating value={selectedProvider.rating || 0} readOnly />
                    <Typography variant="body2">
                      {selectedProvider.rating ? selectedProvider.rating.toFixed(2) : 'Not rated'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Available Slots</Typography>
                  <Typography variant="body2">
                    {selectedProvider.slots?.length > 0
                      ? selectedProvider.slots.join(', ')
                      : 'No slots defined'}
                  </Typography>
                </Grid>
                {selectedProvider.voice_intro && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Voice Intro</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                      "{selectedProvider.voice_intro}"
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Created</Typography>
                  <Typography variant="body2">
                    {selectedProvider.created_at
                      ? new Date(selectedProvider.created_at).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDetailsClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Register Provider Dialog */}
      <Dialog open={openRegisterDialog} onClose={handleRegisterClose} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Provider</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Provider Name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            margin="normal"
            placeholder="e.g., Raj Kumar"
            disabled={registering}
          />
          <TextField
            fullWidth
            label="Service Type"
            name="service"
            value={formData.service}
            onChange={handleFormChange}
            margin="normal"
            placeholder="e.g., Plumber"
            disabled={registering}
          />
          <TextField
            fullWidth
            label="Contact Number"
            name="contact"
            value={formData.contact}
            onChange={handleFormChange}
            margin="normal"
            placeholder="e.g., 9876543210"
            disabled={registering}
          />
          <TextField
            fullWidth
            label="Availability Slot"
            name="slots"
            value={formData.slots}
            onChange={handleFormChange}
            margin="normal"
            placeholder="e.g., Mon-Fri 9AM-5PM"
            disabled={registering}
          />
          <TextField
            fullWidth
            label="Voice Introduction"
            name="voice_intro"
            value={formData.voice_intro}
            onChange={handleFormChange}
            margin="normal"
            placeholder="e.g., Hello, I am your trusted service provider"
            multiline
            rows={2}
            disabled={registering}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRegisterClose} disabled={registering}>
            Cancel
          </Button>
          <Button
            onClick={handleRegisterSubmit}
            variant="contained"
            disabled={registering || !formData.name || !formData.service || !formData.contact}
          >
            {registering ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProvidersPage;
