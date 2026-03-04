'use client';

import { useState, useEffect, useCallback } from 'react';

interface WebSocketMessage {
  type: 'price_update' | 'new_gene' | 'transaction' | 'evolution';
  data: any;
  timestamp: number;
}

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      setError(new Error('WebSocket error'));
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: any) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(message));
      }
    },
    [socket, isConnected]
  );

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
  };
}

// 实时价格更新Hook
export function useRealtimePrices() {
  const { lastMessage, isConnected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'
  );

  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (lastMessage?.type === 'price_update') {
      setPrices((prev) => ({
        ...prev,
        [lastMessage.data.geneId]: lastMessage.data.price,
      }));
    }
  }, [lastMessage]);

  return { prices, isConnected };
}

// 实时活动Feed Hook
export function useActivityFeed() {
  const { lastMessage, isConnected } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws'
  );

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (lastMessage?.type === 'transaction' || lastMessage?.type === 'evolution') {
      setActivities((prev) => [lastMessage.data, ...prev].slice(0, 50));
    }
  }, [lastMessage]);

  return { activities, isConnected };
}
