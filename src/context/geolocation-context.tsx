'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface Geolocation {
  latitude: number;
  longitude: number;
}

interface GeolocationContextType {
  location: Geolocation | null;
  error: string | null;
}

export const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const GeolocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(error.message);
    };

    // Ask for permission
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);

    // Set up a watch to get updates, e.g., if the user moves
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError);

    // Clean up the watcher when the component unmounts
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <GeolocationContext.Provider value={{ location, error }}>
      {children}
    </GeolocationContext.Provider>
  );
};
