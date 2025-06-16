import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  LocationOn,
  Search,
  Close,
  MyLocation
} from '@mui/icons-material';
import { useSettings } from '../contexts/SettingsContext';

const LocationPicker = ({ 
  value, 
  onChange, 
  onClose, 
  open, 
  label = "Select Location",
  required = false 
}) => {
  const { translations } = useSettings();
  const t = translations.common;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!open) return;

    const initMap = async () => {
      try {
        setLoading(true);
        setError('');

        // Wait for Google Maps API to load
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!window.google || !window.google.maps) {
          if (attempts >= maxAttempts) {
            throw new Error('Google Maps API failed to load');
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        // Wait for the map container to be available
        if (!mapRef.current) {
          throw new Error('Map container not available');
        }

        // Initialize map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: value?.latitude && value?.longitude 
            ? { lat: value.latitude, lng: value.longitude }
            : { lat: 44.4268, lng: 26.1025 }, // Bucharest, Romania
          zoom: value?.latitude && value?.longitude ? 15 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        setMap(mapInstance);

        // Initialize marker
        const markerInstance = new window.google.maps.Marker({
          map: mapInstance,
          draggable: true,
          position: value?.latitude && value?.longitude 
            ? { lat: value.latitude, lng: value.longitude }
            : { lat: 44.4268, lng: 26.1025 }
        });

        setMarker(markerInstance);

        // Set initial location if provided
        if (value?.name) {
          setSelectedLocation(value);
          setSearchQuery(value.name);
        }

        // Initialize autocomplete
        if (searchInputRef.current) {
          const autocompleteInstance = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'ro' } // Restrict to Romania
          });

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            if (place.geometry) {
              const location = {
                name: place.formatted_address || place.name,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              };
              
              setSelectedLocation(location);
              markerInstance.setPosition(place.geometry.location);
              mapInstance.setCenter(place.geometry.location);
              mapInstance.setZoom(15);
            }
          });

          setAutocomplete(autocompleteInstance);
        }

        // Add click listener to map
        mapInstance.addListener('click', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          markerInstance.setPosition(event.latLng);
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const location = {
                name: results[0].formatted_address,
                latitude: lat,
                longitude: lng
              };
              setSelectedLocation(location);
              setSearchQuery(results[0].formatted_address);
            } else {
              const location = {
                name: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng
              };
              setSelectedLocation(location);
              setSearchQuery(location.name);
            }
          });
        });

        // Add marker drag listener
        markerInstance.addListener('dragend', (event) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          // Reverse geocode to get address
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const location = {
                name: results[0].formatted_address,
                latitude: lat,
                longitude: lng
              };
              setSelectedLocation(location);
              setSearchQuery(results[0].formatted_address);
            } else {
              const location = {
                name: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng
              };
              setSelectedLocation(location);
              setSearchQuery(location.name);
            }
          });
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load Google Maps. Please check your internet connection and try again.');
        setLoading(false);
      }
    };

    // Add a small delay to ensure the dialog is fully rendered
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [open, value]);

  // Handle current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (map && marker) {
            const location = { lat, lng };
            marker.setPosition(location);
            map.setCenter(location);
            map.setZoom(15);
            
            // Reverse geocode to get address
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
              if (status === 'OK' && results[0]) {
                const locationData = {
                  name: results[0].formatted_address,
                  latitude: lat,
                  longitude: lng
                };
                setSelectedLocation(locationData);
                setSearchQuery(results[0].formatted_address);
              } else {
                const locationData = {
                  name: `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
                  latitude: lat,
                  longitude: lng
                };
                setSelectedLocation(locationData);
                setSearchQuery(locationData.name);
              }
            });
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          setError('Unable to get current location. Please select manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedLocation) {
      onChange(selectedLocation);
      onClose();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        // Clean up map instance
        setMap(null);
      }
    };
  }, []);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {label}
          </Typography>
          <IconButton onClick={handleCancel}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              ref={searchInputRef}
              fullWidth
              placeholder={t.searchLocation || "Search for a location..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button
              variant="outlined"
              onClick={handleCurrentLocation}
              startIcon={<MyLocation />}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {t.currentLocation || "Current"}
            </Button>
          </Box>
          
          {selectedLocation && (
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn />
                <Typography variant="body2">
                  <strong>{t.selectedLocation || "Selected:"}</strong> {selectedLocation.name}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ ml: 4 }}>
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Typography>
            </Paper>
          )}
        </Box>
        
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Box
            ref={mapRef}
            sx={{
              width: '100%',
              height: '100%',
              minHeight: '400px',
              display: loading || error ? 'none' : 'block'
            }}
          />
          {loading && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'background.paper'
            }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Box sx={{ 
              p: 3, 
              textAlign: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can still enter a location manually:
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter location name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    setSelectedLocation({
                      name: e.target.value,
                      latitude: 0,
                      longitude: 0
                    });
                  } else {
                    setSelectedLocation(null);
                  }
                }}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel}>
          {t.cancel || "Cancel"}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedLocation}
          startIcon={<LocationOn />}
        >
          {t.confirmLocation || "Confirm Location"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPicker; 