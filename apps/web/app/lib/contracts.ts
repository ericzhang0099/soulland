// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  sepolia: {
    identityNFT: process.env.NEXT_PUBLIC_IDENTITY_NFT_ADDRESS as `0x${string}`,
    instructorNFT: process.env.NEXT_PUBLIC_INSTRUCTOR_NFT_ADDRESS as `0x${string}`,
    evolutionNFT: process.env.NEXT_PUBLIC_EVOLUTION_NFT_ADDRESS as `0x${string}`,
    agcToken: process.env.NEXT_PUBLIC_AGC_TOKEN_ADDRESS as `0x${string}`,
    genLoopCore: process.env.NEXT_PUBLIC_GENLOOP_CORE_ADDRESS as `0x${string}`,
    // 2.0 合约
    geneToken: process.env.NEXT_PUBLIC_GENE_TOKEN_ADDRESS as `0x${string}`,
    geneRegistry: process.env.NEXT_PUBLIC_GENE_REGISTRY_ADDRESS as `0x${string}`,
    geneExchange: process.env.NEXT_PUBLIC_GENE_EXCHANGE_ADDRESS as `0x${string}`,
  },
};

// 合约 ABI
export const IDENTITY_NFT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getIdentity',
    outputs: [{
      components: [
        { internalType: 'uint8', name: 'level', type: 'uint8' },
        { internalType: 'uint256', name: 'entryRank', type: 'uint256' },
        { internalType: 'uint256', name: 'entryTime', type: 'uint256' },
        { internalType: 'uint256', name: 'currentContribution', type: 'uint256' },
        { internalType: 'uint256', name: 'lastActivity', type: 'uint256' },
        { internalType: 'bool', name: 'canUpgrade', type: 'bool' },
        { internalType: 'bool', name: 'canDowngrade', type: 'bool' },
        { internalType: 'uint256', name: 'upgradeThreshold', type: 'uint256' },
      ],
      internalType: 'struct IdentityNFT.Identity',
      name: '',
      type: 'tuple',
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'mintIdentity',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const AGC_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'buyer', type: 'address' },
      { internalType: 'address', name: 'seller', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'processTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const GENE_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'geneId', type: 'uint256' },
      { internalType: 'string', name: 'metadataURI', type: 'string' },
    ],
    name: 'mintGene',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// 等级名称映射
export const LEVEL_NAMES = ['None', '道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'];

// 等级颜色映射
export const LEVEL_COLORS: Record<number, string> = {
  0: 'text-gray-400',
  1: 'text-yellow-400',
  2: 'text-purple-400',
  3: 'text-blue-400',
  4: 'text-green-400',
  5: 'text-teal-400',
  6: 'text-orange-400',
  7: 'text-pink-400',
  8: 'text-indigo-400',
  9: 'text-gray-400',
};
