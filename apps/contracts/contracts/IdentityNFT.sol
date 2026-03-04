// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./GenLoopTypes.sol";

/**
 * @title IdentityNFT
 * @notice 身份等级NFT合约 - 九级修仙等级系统（道祖→化神）
 * @dev 基于OpenZeppelin ERC721标准，支持动态升降级机制
 */
contract IdentityNFT is ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant IDENTITY_ADMIN = keccak256("IDENTITY_ADMIN");
    bytes32 public constant LEVEL_UPGRADER = keccak256("LEVEL_UPGRADER");
    bytes32 public constant METADATA_MANAGER = keccak256("METADATA_MANAGER");
    
    // ============ 修仙等级枚举 ============
    
    /**
     * @notice 九级修仙等级（从高到低）
     * @dev 1=化神(最低), 9=道祖(最高)
     */
    enum CultivationLevel {
        Huashen,        // 化神 - Level 1
        Yuanying,       // 元婴 - Level 2
        Jindan,         // 金丹 - Level 3
        Zhuji,          // 筑基 - Level 4
        Lianqi,         // 炼气 - Level 5
        Foundation,     // 筑基(巩固) - Level 6
        Core,           // 核心 - Level 7
        Nascent,        // 元婴(圆满) - Level 8
        Daozu           // 道祖 - Level 9
    }
    
    // ============ 结构体定义 ============
    
    /**
     * @notice 身份NFT数据结构
     */
    struct Identity {
        uint256 tokenId;                    // NFT唯一ID
        address owner;                      // 持有者地址
        CultivationLevel level;             // 当前修仙等级
        uint256 levelScore;                 // 等级积分 (0-10000)
        uint256 totalContribution;          // 总贡献值
        uint256 createdAt;                  // 创建时间
        uint256 lastUpgradedAt;             // 最后升级时间
        uint256 upgradeCount;               // 升级次数
        uint256 downgradeCount;             // 降级次数
        bool isActive;                      // 是否活跃
        string metadataURI;                 // 元数据URI
    }
    
    /**
     * @notice 等级配置
     */
    struct LevelConfig {
        uint256 minScore;                   // 最低积分要求
        uint256 maxScore;                   // 最高积分上限
        uint256 weight;                     // 等级权重 (用于收益分配)
        string name;                        // 等级名称
        string description;                 // 等级描述
    }
    
    // ============ 状态变量 ============
    
    // 身份数据存储
    mapping(uint256 => Identity) public identities;
    mapping(address => uint256) public ownerToIdentity;
    
    // 等级配置 (level => config)
    mapping(CultivationLevel => LevelConfig) public levelConfigs;
    
    // 等级积分阈值
    uint256 public constant LEVEL_1_THRESHOLD = 0;      // 化神
    uint256 public constant LEVEL_2_THRESHOLD = 1000;   // 元婴
    uint256 public constant LEVEL_3_THRESHOLD = 2500;   // 金丹
    uint256 public constant LEVEL_4_THRESHOLD = 4500;   // 筑基
    uint256 public constant LEVEL_5_THRESHOLD = 7000;   // 炼气
    uint256 public constant LEVEL_6_THRESHOLD = 8000;   // 筑基(巩固)
    uint256 public constant LEVEL_7_THRESHOLD = 8500;   // 核心
    uint256 public constant LEVEL_8_THRESHOLD = 9000;   // 元婴(圆满)
    uint256 public constant LEVEL_9_THRESHOLD = 9500;   // 道祖
    uint256 public constant MAX_SCORE = 10000;
    
    // 升级/降级冷却期
    uint256 public upgradeCooldown = 1 days;
    uint256 public downgradeCooldown = 7 days;
    
    // 每人只能持有一个身份NFT
    bool public oneIdentityPerUser = true;
    
    // 计数器
    uint256 public nextTokenId = 1;
    uint256 public totalIdentities;
    
    // ============ 事件定义 ============
    
    event IdentityMinted(
        uint256 indexed tokenId,
        address indexed owner,
        CultivationLevel level,
        uint256 timestamp
    );
    
    event LevelUpgraded(
        uint256 indexed tokenId,
        CultivationLevel oldLevel,
        CultivationLevel newLevel,
        uint256 newScore,
        uint256 timestamp
    );
    
    event LevelDowngraded(
        uint256 indexed tokenId,
        CultivationLevel oldLevel,
        CultivationLevel newLevel,
        uint256 newScore,
        uint256 timestamp
    );
    
    event ScoreUpdated(
        uint256 indexed tokenId,
        uint256 oldScore,
        uint256 newScore,
        uint256 timestamp
    );
    
    event ContributionAdded(
        uint256 indexed tokenId,
        address indexed contributor,
        uint256 amount,
        uint256 newTotal
    );
    
    event IdentityDeactivated(uint256 indexed tokenId, uint256 timestamp);
    event IdentityReactivated(uint256 indexed tokenId, uint256 timestamp);
    
    // ============ 构造函数 ============
    
    constructor() ERC721("GenLoop Identity", "GLID") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(IDENTITY_ADMIN, msg.sender);
        _grantRole(LEVEL_UPGRADER, msg.sender);
        _grantRole(METADATA_MANAGER, msg.sender);
        
        // 初始化等级配置
        _initializeLevelConfigs();
    }
    
    // ============ 初始化函数 ============
    
    function _initializeLevelConfigs() internal {
        // Level 1: 化神
        levelConfigs[CultivationLevel.Huashen] = LevelConfig({
            minScore: LEVEL_1_THRESHOLD,
            maxScore: LEVEL_2_THRESHOLD - 1,
            weight: 100,  // 1x
            name: "Huashen",
            description: "Transforming Spirit - The beginning of cultivation"
        });
        
        // Level 2: 元婴
        levelConfigs[CultivationLevel.Yuanying] = LevelConfig({
            minScore: LEVEL_2_THRESHOLD,
            maxScore: LEVEL_3_THRESHOLD - 1,
            weight: 150,  // 1.5x
            name: "Yuanying",
            description: "Nascent Soul - Forming the soul core"
        });
        
        // Level 3: 金丹
        levelConfigs[CultivationLevel.Jindan] = LevelConfig({
            minScore: LEVEL_3_THRESHOLD,
            maxScore: LEVEL_4_THRESHOLD - 1,
            weight: 225,  // 2.25x
            name: "Jindan",
            description: "Golden Core - Solidifying the foundation"
        });
        
        // Level 4: 筑基
        levelConfigs[CultivationLevel.Zhuji] = LevelConfig({
            minScore: LEVEL_4_THRESHOLD,
            maxScore: LEVEL_5_THRESHOLD - 1,
            weight: 338,  // 3.375x
            name: "Zhuji",
            description: "Foundation Building - Establishing the base"
        });
        
        // Level 5: 炼气
        levelConfigs[CultivationLevel.Lianqi] = LevelConfig({
            minScore: LEVEL_5_THRESHOLD,
            maxScore: LEVEL_6_THRESHOLD - 1,
            weight: 507,  // 5.07x
            name: "Lianqi",
            description: "Qi Refining - Purifying the energy"
        });
        
        // Level 6: 筑基(巩固)
        levelConfigs[CultivationLevel.Foundation] = LevelConfig({
            minScore: LEVEL_6_THRESHOLD,
            maxScore: LEVEL_7_THRESHOLD - 1,
            weight: 760,  // 7.6x
            name: "Foundation Consolidated",
            description: "Strengthened Foundation - Solid base established"
        });
        
        // Level 7: 核心
        levelConfigs[CultivationLevel.Core] = LevelConfig({
            minScore: LEVEL_7_THRESHOLD,
            maxScore: LEVEL_8_THRESHOLD - 1,
            weight: 1140,  // 11.4x
            name: "Core",
            description: "Core Formation - The essence crystallizes"
        });
        
        // Level 8: 元婴(圆满)
        levelConfigs[CultivationLevel.Nascent] = LevelConfig({
            minScore: LEVEL_8_THRESHOLD,
            maxScore: LEVEL_9_THRESHOLD - 1,
            weight: 1710,  // 17.1x
            name: "Nascent Perfection",
            description: "Perfected Soul - Near transcendence"
        });
        
        // Level 9: 道祖
        levelConfigs[CultivationLevel.Daozu] = LevelConfig({
            minScore: LEVEL_9_THRESHOLD,
            maxScore: MAX_SCORE,
            weight: 2565,  // 25.65x
            name: "Daozu",
            description: "Ancestor of Dao - Supreme cultivation"
        });
    }
    
    // ============ 修饰器 ============
    
    modifier identityExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "IdentityNFT: identity does not exist");
        _;
    }
    
    modifier onlyIdentityOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "IdentityNFT: not identity owner");
        _;
    }
    
    // ============ 核心功能 ============
    
    /**
     * @notice 铸造身份NFT
     * @param to 接收地址
     * @param initialScore 初始积分
     * @param metadataURI 元数据URI
     */
    function mintIdentity(
        address to,
        uint256 initialScore,
        string calldata metadataURI
    ) external onlyRole(IDENTITY_ADMIN) nonReentrant whenNotPaused returns (uint256) {
        require(to != address(0), "IdentityNFT: invalid recipient");
        require(initialScore <= MAX_SCORE, "IdentityNFT: score exceeds max");
        
        if (oneIdentityPerUser) {
            require(ownerToIdentity[to] == 0, "IdentityNFT: user already has identity");
        }
        
        uint256 tokenId = nextTokenId++;
        
        // 确定初始等级
        CultivationLevel initialLevel = _calculateLevel(initialScore);
        
        // 存储身份数据
        identities[tokenId] = Identity({
            tokenId: tokenId,
            owner: to,
            level: initialLevel,
            levelScore: initialScore,
            totalContribution: 0,
            createdAt: block.timestamp,
            lastUpgradedAt: block.timestamp,
            upgradeCount: 0,
            downgradeCount: 0,
            isActive: true,
            metadataURI: metadataURI
        });
        
        ownerToIdentity[to] = tokenId;
        totalIdentities++;
        
        // 铸造NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit IdentityMinted(tokenId, to, initialLevel, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @notice 更新积分（可能导致升级或降级）
     * @param tokenId 身份NFT ID
     * @param newScore 新积分
     */
    function updateScore(
        uint256 tokenId,
        uint256 newScore
    ) external onlyRole(LEVEL_UPGRADER) identityExists(tokenId) {
        require(newScore <= MAX_SCORE, "IdentityNFT: score exceeds max");
        
        Identity storage identity = identities[tokenId];
        require(identity.isActive, "IdentityNFT: identity not active");
        
        uint256 oldScore = identity.levelScore;
        CultivationLevel oldLevel = identity.level;
        
        identity.levelScore = newScore;
        
        // 检查等级变化
        CultivationLevel newLevel = _calculateLevel(newScore);
        
        if (uint256(newLevel) > uint256(oldLevel)) {
            // 升级
            require(
                block.timestamp >= identity.lastUpgradedAt + upgradeCooldown,
                "IdentityNFT: upgrade cooldown"
            );
            identity.level = newLevel;
            identity.lastUpgradedAt = block.timestamp;
            identity.upgradeCount++;
            
            emit LevelUpgraded(tokenId, oldLevel, newLevel, newScore, block.timestamp);
        } else if (uint256(newLevel) < uint256(oldLevel)) {
            // 降级
            require(
                block.timestamp >= identity.lastUpgradedAt + downgradeCooldown,
                "IdentityNFT: downgrade cooldown"
            );
            identity.level = newLevel;
            identity.downgradeCount++;
            
            emit LevelDowngraded(tokenId, oldLevel, newLevel, newScore, block.timestamp);
        }
        
        emit ScoreUpdated(tokenId, oldScore, newScore, block.timestamp);
    }
    
    /**
     * @notice 增加贡献值
     * @param tokenId 身份NFT ID
     * @param amount 贡献值
     */
    function addContribution(
        uint256 tokenId,
        uint256 amount
    ) external onlyRole(LEVEL_UPGRADER) identityExists(tokenId) {
        Identity storage identity = identities[tokenId];
        identity.totalContribution += amount;
        
        emit ContributionAdded(tokenId, msg.sender, amount, identity.totalContribution);
    }
    
    /**
     * @notice 批量更新积分
     */
    function batchUpdateScores(
        uint256[] calldata tokenIds,
        uint256[] calldata newScores
    ) external onlyRole(LEVEL_UPGRADER) {
        require(tokenIds.length == newScores.length, "IdentityNFT: array length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_ownerOf(tokenIds[i]) != address(0)) {
                Identity storage identity = identities[tokenIds[i]];
                if (identity.isActive && newScores[i] <= MAX_SCORE) {
                    uint256 oldScore = identity.levelScore;
                    CultivationLevel oldLevel = identity.level;
                    
                    identity.levelScore = newScores[i];
                    CultivationLevel newLevel = _calculateLevel(newScores[i]);
                    
                    if (uint256(newLevel) > uint256(oldLevel)) {
                        identity.level = newLevel;
                        identity.lastUpgradedAt = block.timestamp;
                        identity.upgradeCount++;
                        emit LevelUpgraded(tokenIds[i], oldLevel, newLevel, newScores[i], block.timestamp);
                    } else if (uint256(newLevel) < uint256(oldLevel)) {
                        identity.level = newLevel;
                        identity.downgradeCount++;
                        emit LevelDowngraded(tokenIds[i], oldLevel, newLevel, newScores[i], block.timestamp);
                    }
                    
                    emit ScoreUpdated(tokenIds[i], oldScore, newScores[i], block.timestamp);
                }
            }
        }
    }
    
    // ============ 查询函数 ============
    
    /**
     * @notice 获取身份详情
     */
    function getIdentity(uint256 tokenId) 
        external 
        view 
        identityExists(tokenId) 
        returns (Identity memory) 
    {
        return identities[tokenId];
    }
    
    /**
     * @notice 获取用户的身份NFT ID
     */
    function getIdentityByOwner(address owner) external view returns (uint256) {
        return ownerToIdentity[owner];
    }
    
    /**
     * @notice 检查用户是否有身份NFT
     */
    function hasIdentity(address owner) external view returns (bool) {
        return ownerToIdentity[owner] != 0 && _ownerOf(ownerToIdentity[owner]) != address(0);
    }
    
    /**
     * @notice 获取当前等级
     */
    function getLevel(uint256 tokenId) 
        external 
        view 
        identityExists(tokenId) 
        returns (CultivationLevel) 
    {
        return identities[tokenId].level;
    }
    
    /**
     * @notice 获取等级权重（用于收益分配）
     */
    function getLevelWeight(uint256 tokenId) 
        external 
        view 
        identityExists(tokenId) 
        returns (uint256) 
    {
        return levelConfigs[identities[tokenId].level].weight;
    }
    
    /**
     * @notice 获取等级名称
     */
    function getLevelName(uint256 tokenId) 
        external 
        view 
        identityExists(tokenId) 
        returns (string memory) 
    {
        return levelConfigs[identities[tokenId].level].name;
    }
    
    /**
     * @notice 获取等级配置
     */
    function getLevelConfig(CultivationLevel level) 
        external 
        view 
        returns (LevelConfig memory) 
    {
        return levelConfigs[level];
    }
    
    /**
     * @notice 计算等级
     */
    function _calculateLevel(uint256 score) internal pure returns (CultivationLevel) {
        if (score >= LEVEL_9_THRESHOLD) return CultivationLevel.Daozu;
        if (score >= LEVEL_8_THRESHOLD) return CultivationLevel.Nascent;
        if (score >= LEVEL_7_THRESHOLD) return CultivationLevel.Core;
        if (score >= LEVEL_6_THRESHOLD) return CultivationLevel.Foundation;
        if (score >= LEVEL_5_THRESHOLD) return CultivationLevel.Lianqi;
        if (score >= LEVEL_4_THRESHOLD) return CultivationLevel.Zhuji;
        if (score >= LEVEL_3_THRESHOLD) return CultivationLevel.Jindan;
        if (score >= LEVEL_2_THRESHOLD) return CultivationLevel.Yuanying;
        return CultivationLevel.Huashen;
    }
    
    /**
     * @notice 获取升级到下一级所需积分
     */
    function getNextLevelThreshold(uint256 tokenId) 
        external 
        view 
        identityExists(tokenId) 
        returns (uint256) 
    {
        CultivationLevel currentLevel = identities[tokenId].level;
        
        if (currentLevel == CultivationLevel.Huashen) return LEVEL_2_THRESHOLD;
        if (currentLevel == CultivationLevel.Yuanying) return LEVEL_3_THRESHOLD;
        if (currentLevel == CultivationLevel.Jindan) return LEVEL_4_THRESHOLD;
        if (currentLevel == CultivationLevel.Zhuji) return LEVEL_5_THRESHOLD;
        if (currentLevel == CultivationLevel.Lianqi) return LEVEL_6_THRESHOLD;
        if (currentLevel == CultivationLevel.Foundation) return LEVEL_7_THRESHOLD;
        if (currentLevel == CultivationLevel.Core) return LEVEL_8_THRESHOLD;
        if (currentLevel == CultivationLevel.Nascent) return LEVEL_9_THRESHOLD;
        return MAX_SCORE; // 道祖已经是最高级
    }
    
    /**
     * @notice 获取所有等级统计
     */
    function getLevelStatistics() 
        external 
        view 
        returns (
            uint256[] memory levelCounts,
            uint256 totalActive
        ) 
    {
        levelCounts = new uint256[](9);
        totalActive = 0;
        
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (_ownerOf(i) != address(0) && identities[i].isActive) {
                levelCounts[uint256(identities[i].level)]++;
                totalActive++;
            }
        }
        
        return (levelCounts, totalActive);
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @notice 停用身份
     */
    function deactivateIdentity(uint256 tokenId) 
        external 
        onlyRole(IDENTITY_ADMIN) 
        identityExists(tokenId) 
    {
        identities[tokenId].isActive = false;
        emit IdentityDeactivated(tokenId, block.timestamp);
    }
    
    /**
     * @notice 重新激活身份
     */
    function reactivateIdentity(uint256 tokenId) 
        external 
        onlyRole(IDENTITY_ADMIN) 
        identityExists(tokenId) 
    {
        identities[tokenId].isActive = true;
        emit IdentityReactivated(tokenId, block.timestamp);
    }
    
    /**
     * @notice 更新等级配置
     */
    function updateLevelConfig(
        CultivationLevel level,
        uint256 minScore,
        uint256 maxScore,
        uint256 weight,
        string calldata name,
        string calldata description
    ) external onlyRole(IDENTITY_ADMIN) {
        levelConfigs[level] = LevelConfig({
            minScore: minScore,
            maxScore: maxScore,
            weight: weight,
            name: name,
            description: description
        });
    }
    
    /**
     * @notice 设置升级冷却期
     */
    function setUpgradeCooldown(uint256 cooldown) external onlyRole(IDENTITY_ADMIN) {
        upgradeCooldown = cooldown;
    }
    
    /**
     * @notice 设置降级冷却期
     */
    function setDowngradeCooldown(uint256 cooldown) external onlyRole(IDENTITY_ADMIN) {
        downgradeCooldown = cooldown;
    }
    
    /**
     * @notice 设置是否每人一个身份
     */
    function setOneIdentityPerUser(bool enabled) external onlyRole(IDENTITY_ADMIN) {
        oneIdentityPerUser = enabled;
    }
    
    /**
     * @notice 更新元数据URI
     */
    function updateMetadataURI(
        uint256 tokenId, 
        string calldata newURI
    ) external onlyRole(METADATA_MANAGER) identityExists(tokenId) {
        _setTokenURI(tokenId, newURI);
        identities[tokenId].metadataURI = newURI;
    }
    
    /**
     * @notice 暂停合约
     */
    function pause() external onlyRole(IDENTITY_ADMIN) {
        _pause();
    }
    
    /**
     * @notice 恢复合约
     */
    function unpause() external onlyRole(IDENTITY_ADMIN) {
        _unpause();
    }
    
    // ============ 重写函数 ============
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        
        // 更新身份数据中的所有者
        if (to != address(0)) {
            identities[tokenId].owner = to;
            ownerToIdentity[to] = tokenId;
        }
        
        // 清除原所有者的映射
        if (from != address(0)) {
            delete ownerToIdentity[from];
        }
        
        return from;
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}