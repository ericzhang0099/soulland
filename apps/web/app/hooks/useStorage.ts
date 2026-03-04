'use client';

import { useState, useEffect, useCallback } from 'react';

// 本地存储Hook（增强版）
interface UseLocalStorageOptions<T> {
  key: string;
  defaultValue: T;
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

export function useLocalStorage<T>(options: UseLocalStorageOptions<T>) {
  const {
    key,
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setValue(deserializer(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key, deserializer]);

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, value]
  );

  const removeStoredValue = useCallback(() => {
    try {
      setValue(defaultValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return { value, setValue: setStoredValue, removeValue: removeStoredValue, isLoaded };
}

// Session存储Hook
export function useSessionStorage<T>(options: UseLocalStorageOptions<T>) {
  const {
    key,
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        setValue(deserializer(item));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key, deserializer]);

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, serializer(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, serializer, value]
  );

  const removeStoredValue = useCallback(() => {
    try {
      setValue(defaultValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return { value, setValue: setStoredValue, removeValue: removeStoredValue };
}

// Cookie Hook
interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export function useCookie(key: string, defaultValue = '', options: CookieOptions = {}) {
  const { days = 7, path = '/', secure = false, sameSite = 'lax' } = options;
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const cookie = cookies.find((c) => c.trim().startsWith(`${key}=`));
    if (cookie) {
      setValue(decodeURIComponent(cookie.split('=')[1]));
    }
  }, [key]);

  const setCookie = useCallback(
    (newValue: string) => {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

      let cookieString = `${key}=${encodeURIComponent(newValue)};expires=${expires.toUTCString()};path=${path}`;
      if (secure) cookieString += ';secure';
      if (sameSite) cookieString += `;samesite=${sameSite}`;

      document.cookie = cookieString;
      setValue(newValue);
    },
    [key, days, path, secure, sameSite]
  );

  const removeCookie = useCallback(() => {
    document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${path}`;
    setValue('');
  }, [key, path]);

  return { value, setValue: setCookie, removeValue: removeCookie };
}

// URL状态Hook
export function useUrlState<T extends Record<string, any>>(defaultState: T) {
  const [state, setState] = useState<T>(defaultState);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newState = { ...defaultState };

    Object.keys(defaultState).forEach((key) => {
      const value = params.get(key);
      if (value !== null) {
        try {
          newState[key as keyof T] = JSON.parse(value);
        } catch {
          newState[key as keyof T] = value as any;
        }
      }
    });

    setState(newState);
  }, []);

  const setUrlState = useCallback(
    (newState: Partial<T> | ((prev: T) => Partial<T>)) => {
      const stateToMerge = newState instanceof Function ? newState(state) : newState;
      const mergedState = { ...state, ...stateToMerge };
      setState(mergedState);

      const params = new URLSearchParams();
      Object.entries(mergedState).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });

      window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
    },
    [state]
  );

  return [state, setUrlState] as const;
}

// 浏览器历史Hook
export function useHistoryState<T>(defaultState: T) {
  const [state, setState] = useState<T>(defaultState);

  const pushState = useCallback((newState: T) => {
    window.history.pushState(newState, '', window.location.href);
    setState(newState);
  }, []);

  const replaceState = useCallback((newState: T) => {
    window.history.replaceState(newState, '', window.location.href);
    setState(newState);
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setState(e.state ?? defaultState);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [defaultState]);

  return { state, pushState, replaceState };
}
