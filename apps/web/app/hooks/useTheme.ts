'use client';

import { useState, useEffect } from 'react';

interface Theme {
  isDark: boolean;
  toggle: () => void;
}

export function useTheme(): Theme {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // 检查本地存储或系统偏好
    const saved = localStorage.getItem('theme');
    if (saved) {
      setIsDark(saved === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    // 应用主题
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => setIsDark(!isDark);

  return { isDark, toggle };
}
