export const CONTRACTS = {
  sepolia: {
    geneToken: "0x6e8e47d3c846Ddf0677D8864504707c33fDfd790",
    geneRegistry: "0x69eE5b18C7d698B065b12B9bCC033Cda7F1BFe44",
    geneExchange: "0x2CB9Ab014e4D4032CAEbf34bB6778164BE7ACF20",
    geneMerging: "0x56a8205E10812f4aae2A8e8d034630eEcd29feba",
    paymentHandler: "0xD4f0ac032E35deB8C9830166Cf5EDDB5352B5436",
    alipayPaymentHandler: "",
  },
};

// 支付宝支付处理器 ABI
export const ALIPAY_PAYMENT_ABI = [
  // 读函数
  "function orders(bytes32 orderId) external view returns (tuple(bytes32 orderId, bytes32 alipayOrderNo, address payer, uint256 amountCny, uint256 pointsAmount, uint8 status, uint256 createdAt, uint256 paidAt, uint256 completedAt, string metadata))",
  "function getOrder(bytes32 orderId) external view returns (tuple(bytes32 orderId, bytes32 alipayOrderNo, address payer, uint256 amountCny, uint256 pointsAmount, uint8 status, uint256 createdAt, uint256 paidAt, uint256 completedAt, string metadata))",
  "function getUserOrders(address user) external view returns (bytes32[] memory)",
  "function getUserOrderCount(address user) external view returns (uint256)",
  "function calculatePoints(uint256 amountCny) external view returns (uint256)",
  "function exchangeRate() external view returns (uint256)",
  "function minAmount() external view returns (uint256)",
  "function maxAmount() external view returns (uint256)",
  "function totalOrders() external view returns (uint256)",
  "function totalPaidOrders() external view returns (uint256)",
  "function totalCompletedOrders() external view returns (uint256)",
  "function isAlipayOrderUsed(string calldata alipayOrderNo) external view returns (bool)",
  // 写函数
  "function createOrder(uint256 amountCny, string calldata metadata) external returns (bytes32 orderId)",
  "function cancelOrder(bytes32 orderId) external",
  "function confirmPayment(bytes32 orderId, string calldata alipayOrderNo) external",
  "function batchConfirmPayments(bytes32[] calldata orderIds, string[] calldata alipayOrderNos) external",
  "function refundOrder(bytes32 orderId, uint256 refundPoints) external",
  // 管理函数
  "function setExchangeRate(uint256 newRate) external",
  "function setAmountLimits(uint256 _min, uint256 _max) external",
  "function pause() external",
  "function unpause() external",
  // 事件
  "event OrderCreated(bytes32 indexed orderId, address indexed payer, uint256 amountCny, uint256 pointsAmount)",
  "event OrderPaid(bytes32 indexed orderId, bytes32 indexed alipayOrderNo, uint256 paidAt)",
  "event OrderCompleted(bytes32 indexed orderId, address indexed payer, uint256 pointsAmount)",
  "event OrderCancelled(bytes32 indexed orderId)",
  "event OrderRefunded(bytes32 indexed orderId, uint256 refundAmount)",
];

export const GENE_TOKEN_ABI = [
  // GUGS: 支持 payload 的铸币函数
  "function mintGeneWithPayload(address to, uint256 geneId, string memory metadataURI, tuple(uint8 format, string encoding, string data, bytes32 contentHash, string mimeType) calldata payload) external returns (bool)",
  "function getGenePayload(uint256 geneId) external view returns (tuple(uint8 format, string encoding, string data, bytes32 contentHash, string mimeType))",
  "function getGeneByContentHash(bytes32 contentHash) external view returns (uint256)",
  "function contentHashExists(bytes32 contentHash) external view returns (bool)",
  "function updatePayload(uint256 geneId, tuple(uint8 format, string encoding, string data, bytes32 contentHash, string mimeType) calldata newPayload) external",
  // GUGS 事件
  "event GeneMintedWithPayload(uint256 indexed geneId, address indexed creator, uint8 format, bytes32 contentHash)",
  "event PayloadUpdated(uint256 indexed geneId, bytes32 newContentHash)",
  // 传统函数
  "function mintGene(address to, uint256 geneId, string memory metadataURI) external returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function geneExists(uint256 geneId) external view returns (bool)",
  "function getGenesByOwner(address owner) external view returns (uint256[] memory)",
  "function geneCreators(uint256 geneId) external view returns (address)",
  "function genePayloads(uint256 geneId) external view returns (uint8 format, string encoding, string data, bytes32 contentHash, string mimeType)",
  "function contentHashToGeneId(bytes32 contentHash) external view returns (uint256)",
  "function burnGene(uint256 geneId) external",
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
];

// GUGS: GeneFormat 枚举映射
export enum GeneFormat {
  Native = 0,   // 原生 GenLoop 格式
  GEP = 1,      // EvoMap GEP 格式 (JSON)
  SkillMD = 2,  // ClawHub SKILL.md 格式
  Custom = 3,   // 自定义格式
}

// GUGS: 基因载荷接口
export interface GenePayload {
  format: GeneFormat;
  encoding: string;
  data: string;
  contentHash: string;
  mimeType: string;
}

// GUGS: 从合约返回的原始 payload 转换为 GenePayload
export function parseGenePayload(raw: any): GenePayload {
  // 处理不同的返回格式 (tuple vs object)
  if (Array.isArray(raw)) {
    return {
      format: raw[0],
      encoding: raw[1],
      data: raw[2],
      contentHash: raw[3],
      mimeType: raw[4],
    };
  }
  return {
    format: raw.format,
    encoding: raw.encoding,
    data: raw.data,
    contentHash: raw.contentHash,
    mimeType: raw.mimeType,
  };
}

// GUGS: 创建 payload 用于合约调用
export function createGenePayload(
  format: GeneFormat,
  data: string,
  encoding: string = 'utf-8',
  mimeType?: string
): Omit<GenePayload, 'contentHash'> & { contentHash: string } {
  // 计算 contentHash (使用 keccak256)
  const contentHash = computeKeccak256(data);
  
  return {
    format,
    encoding,
    data,
    contentHash,
    mimeType: mimeType || getDefaultMimeType(format),
  };
}

// 获取默认 MIME 类型
function getDefaultMimeType(format: GeneFormat): string {
  switch (format) {
    case GeneFormat.GEP:
      return 'application/json';
    case GeneFormat.SkillMD:
      return 'text/markdown';
    case GeneFormat.Native:
      return 'application/json';
    case GeneFormat.Custom:
    default:
      return 'application/octet-stream';
  }
}

// 简单的 keccak256 哈希计算 (需要引入 ethers 或类似库)
function computeKeccak256(data: string): string {
  // 注意：实际使用时应该使用 ethers.utils.keccak256 或类似函数
  // 这里返回占位符，实际实现应该在调用时处理
  return '0x' + '0'.repeat(64);
}

export const GENE_REGISTRY_ABI = [
  "function registerGene(address creator, uint8 geneType, uint256 rarityScore, bytes32 dnaHash) external returns (uint256)",
  "function getGene(uint256 geneId) external view returns (tuple(uint256 id, address creator, uint8 geneType, uint256 rarityScore, bytes32 dnaHash, uint256 createdAt, uint256 parentA, uint256 parentB, uint256 generation, bool isActive))",
  "function getUserGenes(address user) external view returns (uint256[] memory)",
  "function canMerge(uint256 geneId) external view returns (bool)",
];

export const GENE_EXCHANGE_ABI = [
  "function createCollectionOrder(uint256 geneId, uint256 price, address paymentToken) external returns (uint256)",
  "function collectGene(uint256 orderId) external payable",
  "function orders(uint256 orderId) external view returns (tuple(uint256 orderId, uint256 geneId, address seller, uint256 price, address paymentToken, uint8 orderType, uint256 createdAt, uint256 expiresAt, bool isActive))",
];

export const GENE_MERGING_ABI = [
  "function mergeGenes(tuple(uint256 parentA, uint256 parentB, address requester, uint256 nonce, uint256 timestamp, bytes32 newDnaHash, uint256 predictedRarity, bytes signature) calldata request) external payable returns (uint256)",
  "function mergeFee() external view returns (uint256)",
  "function totalMerges() external view returns (uint256)",
];
