import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

export function useUserIdentity(address: string | null) {
  const [identity, setIdentity] = useState<any>(null);
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  const fetchIdentity = useCallback(async () => {
    if (!address) return;

    try {
      setLoading(true);
      
      // 获取身份信息
      const identityRes = await fetch(`${API_URL}/api/user/${address}/identity`);
      const identityData = await identityRes.json();
      
      if (identityData.success) {
        setIdentity(identityData.data);
      }

      // 获取余额
      const balanceRes = await fetch(`${API_URL}/api/user/${address}/balance`);
      const balanceData = await balanceRes.json();
      
      if (balanceData.success) {
        setBalance(balanceData.data);
      }
    } catch (error) {
      console.error('Error fetching user identity:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  return {
    identity,
    balance,
    loading,
    refetch: fetchIdentity,
  };
}
