'use client';

import { useState, useEffect, useCallback } from 'react';

interface PermissionState {
  camera: PermissionState;
  microphone: PermissionState;
  notifications: NotificationPermission;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Partial<PermissionState>>({});

  const queryPermission = useCallback(async (name: PermissionName) => {
    try {
      const result = await navigator.permissions.query({ name });
      return result.state;
    } catch {
      return 'prompt';
    }
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      const [camera, microphone, notifications] = await Promise.all([
        queryPermission('camera' as PermissionName),
        queryPermission('microphone' as PermissionName),
        Notification.permission as NotificationPermission,
      ]);

      setPermissions({
        camera: camera as PermissionState,
        microphone: microphone as PermissionState,
        notifications,
      });
    };

    checkPermissions();
  }, [queryPermission]);

  const requestNotification = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermissions((prev) => ({ ...prev, notifications: result }));
    return result;
  }, []);

  return { permissions, requestNotification };
}

// 剪贴板Hook
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  const paste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch {
      return null;
    }
  }, []);

  return { copy, paste, copied };
}

// 全屏Hook
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return { isFullscreen, toggle };
}

// 网络状态Hook
export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 获取连接类型
    const conn = (navigator as any).connection;
    if (conn) {
      setConnectionType(conn.effectiveType);
      conn.addEventListener('change', () => {
        setConnectionType(conn.effectiveType);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}

// 页面可见性Hook
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handler = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return isVisible;
}

// 电池状态Hook
export function useBattery() {
  const [battery, setBattery] = useState<any>(null);

  useEffect(() => {
    const getBattery = async () => {
      try {
        const bat = await (navigator as any).getBattery();
        setBattery(bat);

        const updateBattery = () => {
          setBattery({ ...bat });
        };

        bat.addEventListener('levelchange', updateBattery);
        bat.addEventListener('chargingchange', updateBattery);

        return () => {
          bat.removeEventListener('levelchange', updateBattery);
          bat.removeEventListener('chargingchange', updateBattery);
        };
      } catch {
        // 浏览器不支持
      }
    };

    getBattery();
  }, []);

  return battery;
}
