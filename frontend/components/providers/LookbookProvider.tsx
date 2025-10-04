// components/providers/LookbookProvider.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { StaticImageData } from 'next/image';

// Define the shape of a saved outfit
export type SavedOutfit = {
  id: number;
  title: string;
  images: StaticImageData[];
  tags: string[];
};

// Define what our context will provide
type LookbookContextType = {
  savedOutfits: SavedOutfit[];
  addOutfit: (outfit: Omit<SavedOutfit, 'id'>) => void;
};

// Create the context with a default value
const LookbookContext = createContext<LookbookContextType | undefined>(undefined);

// Create the Provider component
export function LookbookProvider({ children }: { children: ReactNode }) {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  const addOutfit = (outfit: Omit<SavedOutfit, 'id'>) => {
    const newOutfit = { ...outfit, id: Date.now() }; // Create a unique ID
    setSavedOutfits((prevOutfits) => [newOutfit, ...prevOutfits]);
  };

  return (
    <LookbookContext.Provider value={{ savedOutfits, addOutfit }}>
      {children}
    </LookbookContext.Provider>
  );
}

// Create a custom hook to easily use the context
export function useLookbook() {
  const context = useContext(LookbookContext);
  if (context === undefined) {
    throw new Error('useLookbook must be used within a LookbookProvider');
  }
  return context;
}