import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

export function useGenes() {
  const [genes, setGenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchGenes = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/genes?page=${pageNum}`);
      const data = await response.json();

      if (data.success) {
        if (pageNum === 1) {
          setGenes(data.data);
        } else {
          setGenes((prev) => [...prev, ...data.data]);
        }
        setHasMore(data.data.length >= 20);
      }
    } catch (error) {
      console.error('Error fetching genes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setPage(1);
    fetchGenes(1);
  }, [fetchGenes]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGenes(nextPage);
    }
  }, [loading, hasMore, page, fetchGenes]);

  useEffect(() => {
    fetchGenes(1);
  }, [fetchGenes]);

  return {
    genes,
    loading,
    hasMore,
    refresh,
    loadMore,
  };
}

export function useGene(id: string) {
  const [gene, setGene] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGene = async () => {
      try {
        const response = await fetch(`${API_URL}/api/genes/${id}`);
        const data = await response.json();
        if (data.success) {
          setGene(data.data);
        }
      } catch (error) {
        console.error('Error fetching gene:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGene();
    }
  }, [id]);

  return { gene, loading };
}
