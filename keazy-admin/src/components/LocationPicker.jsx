/**
 * @fileoverview LocationPicker - Interactive Map-based Location Selector
 * 
 * A production-ready location picker component that simulates how a mobile app
 * would capture user location using GPS/Maps API. Features:
 * 
 * - Interactive map with click-to-select location
 * - Reverse geocoding to get state/city from coordinates
 * - Preset locations for quick testing
 * - Current location detection (browser GPS)
 * - Adjustable search radius with visual circle
 * - Location details display
 * 
 * Uses Leaflet (free, open-source) for mapping.
 * Reverse geocoding via Nominatim (OpenStreetMap - free).
 * 
 * @module components/LocationPicker
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Slider,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ============================================================================
// PRESET LOCATIONS (for quick testing)
// ============================================================================
const PRESET_LOCATIONS = [
  { 
    name: 'Aligarh (AMU)', 
    lat: 27.9154, 
    lng: 78.0775, 
    state: 'Uttar Pradesh', 
    city: 'Aligarh',
    area: 'AMU Campus'
  },
  { 
    name: 'Aligarh (Mangal Vihar)', 
    lat: 27.8974, 
    lng: 78.0880, 
    state: 'Uttar Pradesh', 
    city: 'Aligarh',
    area: 'Mangal Vihar'
  },
  { 
    name: 'Lucknow (Hazratganj)', 
    lat: 26.8467, 
    lng: 80.9462, 
    state: 'Uttar Pradesh', 
    city: 'Lucknow',
    area: 'Hazratganj'
  },
  { 
    name: 'Delhi (Connaught Place)', 
    lat: 28.6315, 
    lng: 77.2197, 
    state: 'Delhi', 
    city: 'Delhi',
    area: 'Connaught Place'
  },
  { 
    name: 'Delhi (Karol Bagh)', 
    lat: 28.6519, 
    lng: 77.1900, 
    state: 'Delhi', 
    city: 'Delhi',
    area: 'Karol Bagh'
  },
  { 
    name: 'Noida (Sector 62)', 
    lat: 28.6270, 
    lng: 77.3650, 
    state: 'Uttar Pradesh', 
    city: 'Noida',
    area: 'Sector 62'
  },
  { 
    name: 'Agra (Taj Ganj)', 
    lat: 27.1767, 
    lng: 78.0421, 
    state: 'Uttar Pradesh', 
    city: 'Agra',
    area: 'Taj Ganj'
  },
  { 
    name: 'Gurgaon (DLF)', 
    lat: 28.4945, 
    lng: 77.0940, 
    state: 'Haryana', 
    city: 'Gurgaon',
    area: 'DLF Phase 3'
  },
];

// ============================================================================
// MAP EVENT HANDLERS
// ============================================================================

/**
 * Component to handle map click events and update marker position
 */
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Component to recenter map when location changes
 */
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LocationPicker({ 
  onLocationChange, 
  initialLocation = null,
  showRadius = true,
  compact = false 
}) {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [location, setLocation] = useState(initialLocation || {
    lat: 27.8974,
    lng: 78.0880,
    state: 'Uttar Pradesh',
    city: 'Aligarh',
    area: 'Mangal Vihar'
  });
  
  const [radiusKm, setRadiusKm] = useState(10);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [expanded, setExpanded] = useState(!compact);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });

  // ============================================================================
  // REVERSE GEOCODING
  // ============================================================================

  /**
   * Fetches address details from coordinates using Nominatim (OpenStreetMap)
   * This is free and doesn't require an API key
   */
  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    setGeoError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'KeazyVoiceSimulator/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      const address = data.address || {};
      
      // Extract location components
      const state = address.state || address.region || '';
      const city = address.city || address.town || address.village || address.county || '';
      const area = address.suburb || address.neighbourhood || address.road || '';
      
      return { state, city, area };
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setGeoError('Could not fetch address details');
      return { state: '', city: '', area: '' };
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handles location selection from map click or preset
   */
  const handleLocationSelect = useCallback(async (lat, lng, presetData = null) => {
    const newLocation = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      state: presetData?.state || '',
      city: presetData?.city || '',
      area: presetData?.area || ''
    };
    
    // If no preset data, fetch from reverse geocoding
    if (!presetData) {
      const geocoded = await reverseGeocode(lat, lng);
      newLocation.state = geocoded.state;
      newLocation.city = geocoded.city;
      newLocation.area = geocoded.area;
    }
    
    setLocation(newLocation);
    setManualCoords({ lat: newLocation.lat.toString(), lng: newLocation.lng.toString() });
    
    // Notify parent component
    if (onLocationChange) {
      onLocationChange({
        ...newLocation,
        radius_km: radiusKm
      });
    }
  }, [reverseGeocode, radiusKm, onLocationChange]);

  /**
   * Handles preset location selection
   */
  const handlePresetSelect = (preset) => {
    handleLocationSelect(preset.lat, preset.lng, preset);
  };

  /**
   * Gets user's current location via browser Geolocation API
   */
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser');
      return;
    }
    
    setIsGeolocating(true);
    setGeoError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await handleLocationSelect(position.coords.latitude, position.coords.longitude);
        setIsGeolocating(false);
      },
      (error) => {
        setGeoError(`Location error: ${error.message}`);
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  /**
   * Handles manual coordinate input
   */
  const handleManualCoordSubmit = async () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setGeoError('Invalid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setGeoError('Coordinates out of range');
      return;
    }
    
    await handleLocationSelect(lat, lng);
  };

  /**
   * Handles radius change
   */
  const handleRadiusChange = (_, newValue) => {
    setRadiusKm(newValue);
    if (onLocationChange) {
      onLocationChange({
        ...location,
        radius_km: newValue
      });
    }
  };

  // Notify parent on initial load
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange({
        ...location,
        radius_km: radiusKm
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          📍 Location Settings
        </Typography>
        {compact && (
          <Button size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Collapse' : 'Expand Map'}
          </Button>
        )}
      </Box>

      {/* Current Location Display */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginBottom: 2 }}>
        <Chip 
          label={`📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
        {location.state && <Chip label={`🏛️ ${location.state}`} size="small" />}
        {location.city && <Chip label={`🏙️ ${location.city}`} size="small" />}
        {location.area && <Chip label={`📌 ${location.area}`} size="small" variant="outlined" />}
        <Chip 
          label={`🎯 ${radiusKm} km radius`} 
          size="small" 
          color="secondary" 
          variant="outlined"
        />
      </Box>

      {/* Error Display */}
      {geoError && (
        <Alert severity="warning" sx={{ marginBottom: 2 }} onClose={() => setGeoError(null)}>
          {geoError}
        </Alert>
      )}

      <Collapse in={expanded}>
        {/* Preset Locations */}
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="caption" color="textSecondary" gutterBottom display="block">
            Quick Select (Preset Locations):
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {PRESET_LOCATIONS.map((preset) => (
              <Chip
                key={preset.name}
                label={preset.name}
                size="small"
                clickable
                onClick={() => handlePresetSelect(preset)}
                color={location.city === preset.city && location.area === preset.area ? 'primary' : 'default'}
                variant={location.city === preset.city && location.area === preset.area ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Map Container */}
        <Box sx={{ height: 300, marginBottom: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}>
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]} />
            {showRadius && (
              <Circle
                center={[location.lat, location.lng]}
                radius={radiusKm * 1000}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
              />
            )}
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapRecenter lat={location.lat} lng={location.lng} />
          </MapContainer>
        </Box>

        {/* Controls Row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginBottom: 2 }}>
          {/* Get Current Location Button */}
          <Button
            variant="outlined"
            onClick={handleGetCurrentLocation}
            disabled={isGeolocating}
            startIcon={isGeolocating ? <CircularProgress size={16} /> : '🎯'}
            fullWidth
          >
            {isGeolocating ? 'Locating...' : 'Use My Location'}
          </Button>

          {/* Manual Lat Input */}
          <TextField
            label="Latitude"
            size="small"
            value={manualCoords.lat}
            onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
            placeholder="e.g., 27.8974"
            InputProps={{
              endAdornment: isGeocoding && <CircularProgress size={16} />
            }}
          />

          {/* Manual Lng Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Longitude"
              size="small"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords({ ...manualCoords, lng: e.target.value })}
              placeholder="e.g., 78.0880"
              fullWidth
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleManualCoordSubmit}
              disabled={isGeocoding}
            >
              Go
            </Button>
          </Box>
        </Box>

        {/* Radius Slider */}
        {showRadius && (
          <Box sx={{ paddingX: 1 }}>
            <Typography variant="caption" color="textSecondary" gutterBottom display="block">
              Search Radius: {radiusKm} km
            </Typography>
            <Slider
              value={radiusKm}
              onChange={handleRadiusChange}
              min={1}
              max={50}
              step={1}
              marks={[
                { value: 1, label: '1km' },
                { value: 10, label: '10km' },
                { value: 25, label: '25km' },
                { value: 50, label: '50km' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        )}
      </Collapse>

      {/* Instructions */}
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', marginTop: 1 }}>
        💡 Click on the map to select location, or use presets for quick testing. 
        Simulates how a mobile app sends GPS coordinates.
      </Typography>
    </Paper>
  );
}
