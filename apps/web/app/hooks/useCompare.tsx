'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface CompareItem {
  id: string;
  name: string;
  price: string;
  attributes: Record<string, string | number>;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
  isComparing: (id: string) => boolean;
  canAddMore: boolean;
}

const MAX_COMPARE_ITEMS = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addItem = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id) || prev.length >= MAX_COMPARE_ITEMS) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  const isComparing = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const canAddMore = items.length < MAX_COMPARE_ITEMS;

  return (
    <CompareContext.Provider
      value={{ items, addItem, removeItem, clearItems, isComparing, canAddMore }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  return context;
}
