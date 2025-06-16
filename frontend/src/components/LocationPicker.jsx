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
  const searchQueryRef = useRef('');

  // Update ref when search query changes
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

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
            componentRestrictions: { country: 'ro' }, // Restrict to Romania
            fields: ['formatted_address', 'name', 'geometry']
          });

          autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            console.log('Autocomplete place selected:', place);
            
            if (place.geometry && place.geometry.location) {
              const location = {
                name: place.formatted_address || place.name || searchQuery,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              };
              
              setSelectedLocation(location);
              markerInstance.setPosition(place.geometry.location);
              mapInstance.setCenter(place.geometry.location);
              mapInstance.setZoom(15);
              setError(''); // Clear any previous errors
            } else {
              setError('Selected place has no valid location. Please try searching manually.');
            }
          });

          setAutocomplete(autocompleteInstance);
        }

        // Add manual search functionality
        const handleManualSearch = () => {
          const currentSearchQuery = searchQueryRef.current; // Use ref for current value
          
          if (!currentSearchQuery.trim()) {
            setError('Please enter a location to search for.');
            return;
          }

          setError(''); // Clear previous errors
          setLoading(true); // Show loading state
          
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ 
            address: currentSearchQuery,
            componentRestrictions: { country: 'ro' }
          }, (results, status) => {
            setLoading(false); // Hide loading state
            
            if (status === 'OK' && results[0]) {
              const location = {
                name: results[0].formatted_address,
                latitude: results[0].geometry.location.lat(),
                longitude: results[0].geometry.location.lng()
              };
              
              setSelectedLocation(location);
              markerInstance.setPosition(results[0].geometry.location);
              mapInstance.setCenter(results[0].geometry.location);
              mapInstance.setZoom(15);
              setError(''); // Clear any previous errors
            } else {
              setError('Location not found. Please try a different search term or check your spelling.');
            }
          });
        };

        // Store the search function for later use
        window.handleLocationSearch = handleManualSearch;

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
      // Clean up global search function
      if (window.handleLocationSearch) {
        delete window.handleLocationSearch;
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setError(''); // Clear any previous errors
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (window.handleLocationSearch) {
                    window.handleLocationSearch();
                  }
                }
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button
              variant="outlined"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.handleLocationSearch) {
                  window.handleLocationSearch();
                }
              }}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {t.search || "Search"}
            </Button>
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
              display: 'block' // Always show the map container
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
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1
            }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Box sx={{ 
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              zIndex: 2
            }}>
              <Alert 
                severity="error" 
                onClose={() => setError('')}
                sx={{ 
                  boxShadow: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem'
                  }
                }}
              >
                {error}
              </Alert>
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