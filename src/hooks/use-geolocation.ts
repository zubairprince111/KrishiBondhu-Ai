'use client';

import { useContext } from 'react';
import { GeolocationContext } from '@/context/geolocation-context';

export const useGeolocation = () => {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};
