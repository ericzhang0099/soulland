'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const saveToStorage = useCallback((ids: string[]) => {
    localStorage.setItem('favorites', JSON.stringify(ids));
  }, []);

  const addFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavorites = [...prev, id];
      saveToStorage(newFavorites);
      return newFavorites;
    });
  }, [saveToStorage]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.filter((i) => i !== id);
      saveToStorage(newFavorites);
      return newFavorites;
    });
  }, [saveToStorage]);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      if (isFavorite(id)) {
        removeFavorite(id);
      } else {
        addFavorite(id);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
