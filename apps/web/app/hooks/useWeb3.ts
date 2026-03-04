'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, IDENTITY_NFT_ABI, AGC_TOKEN_ABI, LEVEL_NAMES, LEVEL_COLORS } from '../lib/contracts';

const addresses = CONTRACT_ADDRESSES.sepolia;

export function useIdentity() {
  const { address, chainId } = useAccount();

  const { data: identity, isLoading: isLoadingIdentity, refetch } = useReadContract({
    address: addresses.identityNFT,
    abi: IDENTITY_NFT_ABI,
    functionName: 'getIdentity',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { writeContract: register, data: hash, isPending: isRegistering } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const level = identity?.[0] ?? 0;

  return {
    identity: identity ? {
      level,
      levelName: LEVEL_NAMES[level] || 'Unknown',
      levelColor: LEVEL_COLORS[level] || 'text-gray-400',
      entryRank: Number(identity[1]),
      entryTime: new Date(Number(identity[2]) * 1000),
      contribution: Number(identity[3]),
      canUpgrade: identity[5],
    } : null,
    isLoading: isLoadingIdentity,
    register: () => {
      if (!address) return;
      register({
        address: addresses.identityNFT,
        abi: IDENTITY_NFT_ABI,
        functionName: 'mintIdentity',
        args: [address],
      });
    },
    isRegistering: isRegistering || isConfirming,
    isSuccess,
    refetch,
  };
}

export function useAGCBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: addresses.agcToken,
    abi: AGC_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: balance ? Number(balance) / 1e18 : 0,
    isLoading,
    refetch,
  };
}

export function useGeneBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: addresses.geneToken,
    abi: [{ 
      inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: balance ? Number(balance) : 0,
    isLoading,
    refetch,
  };
}
