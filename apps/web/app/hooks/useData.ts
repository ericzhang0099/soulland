'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

// 基因列表 Hook
export function useGenes(filters?: { isActive?: boolean; minPrice?: number; maxPrice?: number }) {
  const [genes, setGenes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getGenes(filters);
      
      if (result.success) {
        setGenes(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch genes');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.isActive, filters?.minPrice, filters?.maxPrice]);

  useEffect(() => {
    fetchGenes();
  }, [fetchGenes]);

  return { genes, isLoading, error, refetch: fetchGenes };
}

// 基因详情 Hook
export function useGene(id: string) {
  const [gene, setGene] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchGene = async () => {
      try {
        setIsLoading(true);
        const result = await apiClient.getGeneById(id);
        
        if (result.success) {
          setGene(result.data);
        } else {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGene();
  }, [id]);

  return { gene, isLoading, error };
}

// 进化记录 Hook
export function useEvolutions(address?: string) {
  const [evolutions, setEvolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvolutions = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const result = await apiClient.getEvolutions(address);
      
      if (result.success) {
        setEvolutions(result.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchEvolutions();
  }, [fetchEvolutions]);

  return { evolutions, isLoading, error, refetch: fetchEvolutions };
}

// 排行榜 Hook
export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getLeaderboard();
      
      if (result.success) {
        // 使用真实数据
        setLeaderboard(result.data || []);
      } else {
        setError(result.error || '获取排行榜失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}

// 统计数据 Hook
export function useStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getStats();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

// 交易 Hook
export function usePurchase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = async (buyer: string, seller: string, geneId: string, amount: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.purchaseGene(buyer, seller, geneId, amount);
      
      if (!result.success) {
        setError(result.error);
        return null;
      }
      
      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { purchase, isLoading, error };
}
