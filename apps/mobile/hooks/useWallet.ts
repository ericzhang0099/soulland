import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

const WALLET_KEY = '@wallet_address';
const WALLET_PRIVATE_KEY = '@wallet_private_key';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 检查已保存的钱包
  useEffect(() => {
    checkStoredWallet();
  }, []);

  const checkStoredWallet = async () => {
    try {
      const storedAddress = await AsyncStorage.getItem(WALLET_KEY);
      if (storedAddress) {
        setAddress(storedAddress);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 连接钱包（使用私钥）
  const connect = useCallback(async (privateKey: string) => {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const walletAddress = wallet.address;

      await AsyncStorage.setItem(WALLET_KEY, walletAddress);
      await AsyncStorage.setItem(WALLET_PRIVATE_KEY, privateKey);

      setAddress(walletAddress);
      setIsConnected(true);
      return walletAddress;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }, []);

  // 断开连接
  const disconnect = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(WALLET_KEY);
      await AsyncStorage.removeItem(WALLET_PRIVATE_KEY);
      setAddress(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, []);

  // 获取签名者
  const getSigner = useCallback(async () => {
    const privateKey = await AsyncStorage.getItem(WALLET_PRIVATE_KEY);
    if (!privateKey) return null;
    return new ethers.Wallet(privateKey);
  }, []);

  return {
    address,
    isConnected,
    isLoading,
    connect,
    disconnect,
    getSigner,
  };
}
