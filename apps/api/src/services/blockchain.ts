import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// 合约ABI（简化版，实际需要完整ABI）
const IdentityNFTABI = [
  "function mintIdentity(address user) external returns (uint256)",
  "function getIdentity(address user) external view returns (tuple(uint8 level, uint256 entryRank, uint256 entryTime, uint256 currentContribution, uint256 lastActivity, bool canUpgrade, bool canDowngrade, uint256 upgradeThreshold))",
  "function getLevel(address user) external view returns (uint8)"
];

const AGCTokenABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function processTransaction(address buyer, address seller, uint256 amount) external",
  "function platformDeduct(address from, uint256 amount, string calldata reason) external"
];

const EvolutionNFTABI = [
  "function certifyEvolution(address agent, uint8 evoType, uint8 level, string calldata skillName, uint256 beforeScore, uint256 afterScore, bytes32 traceHash, string calldata metadataURI) external returns (uint256)",
  "function getAgentEvolutions(address agent) external view returns (uint256[])",
  "function getAgentHighestLevel(address agent) external view returns (uint8)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  
  // 合约实例
  public identityNFT: ethers.Contract;
  public agcToken: ethers.Contract;
  public evolutionNFT: ethers.Contract;
  public genLoopCore: ethers.Contract;
  
  constructor() {
    // 连接到Sepolia测试网
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    
    // 初始化合约
    this.identityNFT = new ethers.Contract(
      process.env.IDENTITY_NFT_ADDRESS!,
      IdentityNFTABI,
      this.signer
    );
    
    this.agcToken = new ethers.Contract(
      process.env.AGC_TOKEN_ADDRESS!,
      AGCTokenABI,
      this.signer
    );
    
    this.evolutionNFT = new ethers.Contract(
      process.env.EVOLUTION_NFT_ADDRESS!,
      EvolutionNFTABI,
      this.signer
    );
  }
  
  /**
   * 铸造身份NFT
   */
  async mintIdentity(userAddress: string): Promise<string> {
    try {
      const tx = await this.identityNFT.mintIdentity(userAddress);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Mint identity error:', error);
      throw error;
    }
  }
  
  /**
   * 获取用户身份
   */
  async getIdentity(userAddress: string) {
    try {
      const identity = await this.identityNFT.getIdentity(userAddress);
      return {
        level: identity.level,
        levelName: this.getLevelName(identity.level),
        entryRank: identity.entryRank.toString(),
        entryTime: new Date(Number(identity.entryTime) * 1000),
        currentContribution: identity.currentContribution.toString(),
        canUpgrade: identity.canUpgrade
      };
    } catch (error) {
      console.error('Get identity error:', error);
      throw error;
    }
  }
  
  /**
   * 获取AGC余额
   */
  async getAGCBalance(userAddress: string): Promise<string> {
    try {
      const balance = await this.agcToken.balanceOf(userAddress);
      return ethers.formatUnits(balance, 18);
    } catch (error) {
      console.error('Get AGC balance error:', error);
      throw error;
    }
  }
  
  /**
   * 处理交易（购买基因）
   */
  async processTransaction(buyer: string, seller: string, amount: string): Promise<string> {
    try {
      const amountWei = ethers.parseUnits(amount, 18);
      const tx = await this.agcToken.processTransaction(buyer, seller, amountWei);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Process transaction error:', error);
      throw error;
    }
  }
  
  /**
   * 平台扣费（推荐服务）
   */
  async platformDeduct(userAddress: string, amount: string, reason: string): Promise<string> {
    try {
      const amountWei = ethers.parseUnits(amount, 18);
      const tx = await this.agcToken.platformDeduct(userAddress, amountWei, reason);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Platform deduct error:', error);
      throw error;
    }
  }
  
  /**
   * 颁发进化证明
   */
  async certifyEvolution(
    agent: string,
    evoType: number,
    level: number,
    skillName: string,
    beforeScore: number,
    afterScore: number
  ): Promise<string> {
    try {
      const traceHash = ethers.keccak256(
        ethers.solidityPacked(['address', 'string', 'uint256'], [agent, skillName, Date.now()])
      );
      
      const tx = await this.evolutionNFT.certifyEvolution(
        agent,
        evoType,
        level,
        skillName,
        beforeScore,
        afterScore,
        traceHash,
        ''
      );
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('Certify evolution error:', error);
      throw error;
    }
  }
  
  /**
   * 获取等级名称
   */
  private getLevelName(level: number): string {
    const levels = ['None', '道祖', '大罗', '太乙', '金仙', '真仙', '大乘', '合体', '炼虚', '化神'];
    return levels[level] || 'Unknown';
  }
}

export const blockchainService = new BlockchainService();
