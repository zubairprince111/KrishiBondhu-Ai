
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface Geolocation {
  latitude: number;
  longitude: number;
}

interface GeolocationContextType {
  location: Geolocation | null;
  error: string | null;
  isGeolocationLoading: boolean;
}

export const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const GeolocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsGeolocationLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
      setIsGeolocationLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(error.message);
      setIsGeolocationLoading(false);
    };

    // Ask for permission
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000
    });

    // We don't use watchPosition anymore to prevent unnecessary re-renders on minor moves
    // The user can manually refresh if they want an updated location.
    
  }, []);

  return (
    <GeolocationContext.Provider value={{ location, error, isGeolocationLoading }}>
      {children}
    </GeolocationContext.Provider>
  );
};
