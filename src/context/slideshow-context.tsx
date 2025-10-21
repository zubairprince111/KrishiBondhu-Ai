'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';

interface SlideshowContextType {
  slideshowImages: ImagePlaceholder[];
  addImage: (image: ImagePlaceholder) => void;
  removeImage: (id: string) => void;
}

const SlideshowContext = createContext<SlideshowContextType | undefined>(undefined);

export const SlideshowProvider = ({ children }: { children: ReactNode }) => {
  const [slideshowImages, setSlideshowImages] = useState<ImagePlaceholder[]>(
    PlaceHolderImages.filter(p => p.id.startsWith('slideshow-'))
  );

  const addImage = (image: ImagePlaceholder) => {
    setSlideshowImages(prev => [...prev, image]);
  };

  const removeImage = (id: string) => {
    setSlideshowImages(prev => prev.filter(image => image.id !== id));
  };

  return (
    <SlideshowContext.Provider value={{ slideshowImages, addImage, removeImage }}>
      {children}
    </SlideshowContext.Provider>
  );
};

export const useSlideshow = () => {
  const context = useContext(SlideshowContext);
  if (context === undefined) {
    throw new Error('useSlideshow must be used within a SlideshowProvider');
  }
  return context;
};
