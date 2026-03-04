'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';

const IDENTITY_NFT_ABI = parseAbi([
  'function getIdentity(address user) view returns (tuple(uint8 level, uint256 entryRank, uint256 entryTime, uint256 currentContribution, uint256 lastActivity, bool canUpgrade, bool canDowngrade, uint256 upgradeThreshold))',
  'function mintIdentity(address user) returns (uint256)',
]);

const AGC_TOKEN_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function mint(address to, uint256 amount)',
]);

const CONTRACT_ADDRESSES = {
  identityNFT: process.env.NEXT_PUBLIC_IDENTITY_NFT_ADDRESS as `0x${string}`,
  agcToken: process.env.NEXT_PUBLIC_AGC_TOKEN_ADDRESS as `0x${string}`,
};

export function useIdentity() {
  const { address } = useAccount();

  const { data: identity, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.identityNFT,
    abi: IDENTITY_NFT_ABI,
    functionName: 'getIdentity',
    args: address ? [address] : undefined,
  });

  const { writeContract: register, isPending: isRegistering } = useWriteContract();

  const levelNames = ['None', '道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'];

  return {
    identity: identity ? {
      level: identity[0],
      levelName: levelNames[identity[0]],
      entryRank: Number(identity[1]),
      entryTime: new Date(Number(identity[2]) * 1000),
      contribution: Number(identity[3]),
      canUpgrade: identity[5],
    } : null,
    isLoading,
    register: () => address && register({
      address: CONTRACT_ADDRESSES.identityNFT,
      abi: IDENTITY_NFT_ABI,
      functionName: 'mintIdentity',
      args: [address],
    }),
    isRegistering,
  };
}

export function useAGCBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.agcToken,
    abi: AGC_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  return {
    balance: balance ? Number(balance) / 1e18 : 0,
    isLoading,
  };
}
