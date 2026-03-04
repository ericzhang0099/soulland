'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useGenes() {
  const [genes, setGenes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGenes();
  }, []);

  const fetchGenes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/genes`);
      const data = await response.json();
      
      if (data.success) {
        setGenes(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { genes, isLoading, error, refetch: fetchGenes };
}

export function useEvolutions(address?: string) {
  const [evolutions, setEvolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (address) {
      fetchEvolutions();
    }
  }, [address]);

  const fetchEvolutions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/evolution/${address}/evolutions`);
      const data = await response.json();
      
      if (data.success) {
        setEvolutions(data.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { evolutions, isLoading, error, refetch: fetchEvolutions };
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/leaderboard`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { leaderboard, isLoading, refetch: fetchLeaderboard };
}
