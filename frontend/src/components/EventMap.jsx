import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const EventMap = ({ location, height = 150 }) => {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not loaded');
      return;
    }

    // Check if we have valid location data
    if (!location || (!location.latitude && !location.longitude && !location.name)) {
      return;
    }

    let lat = 0;
    let lng = 0;

    // If we have coordinates, use them
    if (location.latitude && location.longitude) {
      lat = parseFloat(location.latitude);
      lng = parseFloat(location.longitude);
    } else if (location.name) {
      // If we only have a name, try to geocode it
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: location.name }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const place = results[0].geometry.location;
          lat = place.lat();
          lng = place.lng();
          initializeMap(lat, lng);
        }
      });
      return;
    } else {
      return;
    }

    initializeMap(lat, lng);
  }, [location]);

  const initializeMap = (lat, lng) => {
    if (!mapRef.current) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    // Create new map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.TOP_RIGHT
      }
    });

    mapInstanceRef.current = map;

    // Add marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: location.name || t('eventLocation') || 'Event Location',
      animation: window.google.maps.Animation.DROP
    });

    markerRef.current = marker;

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-weight: bold;">${location.name || t('eventLocation') || 'Event Location'}</div>`
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Trigger resize to ensure map renders correctly
    setTimeout(() => {
      window.google.maps.event.trigger(map, 'resize');
      map.setCenter({ lat, lng });
    }, 100);
  };

  // Check if we have valid location data
  const hasValidLocation = location && (
    (location.latitude && location.longitude) || 
    location.name
  );

  if (!hasValidLocation) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'grey.300'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('noLocationAvailable') || 'No location available'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        ref={mapRef}
        sx={{
          height,
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}
      />
    </Box>
  );
};

export default EventMap; 