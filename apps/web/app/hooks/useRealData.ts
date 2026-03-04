'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/api';

// 搜索 Hook
export function useSearch() {
  const [results, setResults] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, type?: string) => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.search(query, type);
      
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const result = await apiClient.getSearchSuggestions(query);
      if (result.success) {
        setSuggestions(result.data || []);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  return { results, suggestions, isLoading, error, search, getSuggestions };
}

// 活动 Feed Hook
export function useActivityFeed(limit: number = 10) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getActivityFeed(limit);
      
      if (result.success) {
        setActivities(result.data || []);
      }
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, isLoading, refetch: fetchActivities };
}

// 交易历史 Hook
export function useTransactionHistory(address?: string) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.getTransactions(address);
      
      if (result.success) {
        setTransactions(result.data || []);
      }
    } catch {
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, refetch: fetchTransactions };
}