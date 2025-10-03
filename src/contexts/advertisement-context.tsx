'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdvertisementContextType {
  hasAdBeenShown: boolean;
  setAdAsShown: () => void;
}

const AdvertisementContext = createContext<AdvertisementContextType | undefined>(undefined);

export const AdvertisementProvider = ({ children }: { children: ReactNode }) => {
  const [hasAdBeenShown, setHasAdBeenShown] = useState(false);

  const setAdAsShown = () => {
    setHasAdBeenShown(true);
  };

  const value = { hasAdBeenShown, setAdAsShown };

  return (
    <AdvertisementContext.Provider value={value}>
      {children}
    </AdvertisementContext.Provider>
  );
};

export const useAdvertisement = () => {
  const context = useContext(AdvertisementContext);
  if (context === undefined) {
    throw new Error('useAdvertisement must be used within an AdvertisementProvider');
  }
  return context;
};
