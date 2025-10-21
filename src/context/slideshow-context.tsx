'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';

interface SlideshowContextType {
  slideshowImages: ImagePlaceholder[];
  addImage: (image: ImagePlaceholder) => void;
  removeImage: (id: string) => void;
}

const SlideshowContext = createContext<SlideshowContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'krishibondhu-slideshow-images';

export const SlideshowProvider = ({ children }: { children: ReactNode }) => {
  const [slideshowImages, setSlideshowImages] = useState<ImagePlaceholder[]>([]);

  useEffect(() => {
    try {
      const storedImages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedImages) {
        setSlideshowImages(JSON.parse(storedImages));
      } else {
        // Initialize with default images if nothing is in local storage
        const defaultImages = PlaceHolderImages.filter(p => p.id.startsWith('slideshow-'));
        setSlideshowImages(defaultImages);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultImages));
      }
    } catch (error) {
        // If local storage is not available or parsing fails, use defaults
        console.error("Failed to access localStorage:", error);
        setSlideshowImages(PlaceHolderImages.filter(p => p.id.startsWith('slideshow-')));
    }
  }, []);

  const updateLocalStorage = (images: ImagePlaceholder[]) => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(images));
    } catch (error) {
        console.error("Failed to save to localStorage:", error);
    }
  };

  const addImage = (image: ImagePlaceholder) => {
    setSlideshowImages(prev => {
        const newImages = [...prev, image];
        updateLocalStorage(newImages);
        return newImages;
    });
  };

  const removeImage = (id: string) => {
    setSlideshowImages(prev => {
        const newImages = prev.filter(image => image.id !== id);
        updateLocalStorage(newImages);
        return newImages;
    });
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
