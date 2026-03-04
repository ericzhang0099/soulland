// 类型定义

export interface User {
  id: string;
  address: string;
  email: string;
  name?: string;
  identityTokenId?: string;
  level: number;
  contribution: number;
  createdAt: string;
}

export interface Identity {
  level: number;
  levelName: string;
  levelColor: string;
  entryRank: number;
  entryTime: Date;
  contribution: number;
  canUpgrade: boolean;
}

export interface Gene {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  price: string;
  creator: {
    address: string;
    name?: string;
    level?: number;
  };
  ownerId: string;
  metadata?: {
    rarityScore?: number;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'reward' | 'platform_fee';
  geneName?: string;
  amount: string;
  counterparty: string;
  timestamp: string;
  txHash: string;
}

export interface Evolution {
  id: string;
  agentId: string;
  level: number;
  evoType: number;
  skillName: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  traceHash: string;
  txHash?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  address: string;
  name?: string;
  level: number;
  contribution: number;
}

export interface MarketStats {
  totalVolume: number;
  totalTransactions: number;
  activeGenes: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 合约类型
export interface ContractAddresses {
  identityNFT: `0x${string}`;
  instructorNFT: `0x${string}`;
  evolutionNFT: `0x${string}`;
  agcToken: `0x${string}`;
  genLoopCore: `0x${string}`;
  geneToken: `0x${string}`;
  geneRegistry: `0x${string}`;
  geneExchange: `0x${string}`;
}
