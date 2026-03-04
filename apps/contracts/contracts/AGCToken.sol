// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IdentityNFT.sol";

/**
 * @title AGCToken
 * @notice AGC积分合约 - 基于GenLoopPoints扩展
 * @dev 收益分配机制：作者90%，平台10%；等级权重分配
 */
contract AGCToken is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant AGC_ADMIN = keccak256("AGC_ADMIN");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant FEE_MANAGER = keccak256("FEE_MANAGER");
    
    // ============ 结构体定义 ============
    
    /**
     * @notice 收益分配记录
     */
    struct EarningRecord {
        uint256 recordId;
        address author;
        uint256 amount;
        uint256 authorShare;        // 作者分得 (90%)
        uint256 platformShare;      // 平台分得 (10%)
        uint256 levelWeight;        // 等级权重
        uint256 timestamp;
        string source;              // 来源描述
    }
    
    /**
     * @notice 用户收益统计
     */
    struct UserEarnings {
        address user;
        uint256 totalEarned;        // 总收益
        uint256 totalClaimed;       // 已领取
        uint256 pendingAmount;      // 待领取
        uint256 earningCount;       // 收益次数
        uint256 lastEarningAt;      // 最后收益时间
    }
    
    /**
     * @notice 等级权重配置
     */
    struct LevelWeight {
        uint256 level;              // 等级编号
        uint256 weight;             // 权重值 (基点 10000 = 1x)
        string description;
    }
    
    // ============ 状态变量 ============
    
    // IdentityNFT合约引用
    IdentityNFT public identityNFT;
    
    // 收益记录
    mapping(uint256 => EarningRecord) public earningRecords;
    mapping(address => uint256[]) public userEarningRecords;
    uint256 public nextRecordId = 1;
    
    // 用户收益统计
    mapping(address => UserEarnings) public userEarnings;
    mapping(address => bool) public hasEarnings;
    
    // 等级权重 (等级 => 权重)
    mapping(uint256 => LevelWeight) public levelWeights;
    uint256 public defaultWeight = 10000;  // 默认权重 1x
    
    // 平台钱包
    address public platformWallet;
    
    // 收益分配比例 (基点)
    uint256 public constant AUTHOR_SHARE = 9000;     // 90%
    uint256 public constant PLATFORM_SHARE = 1000;   // 10%
    uint256 public constant FEE_PRECISION = 10000;
    
    // 总统计
    uint256 public totalDistributed;
    uint256 public totalToAuthors;
    uint256 public totalToPlatform;
    
    // 暂停提现
    bool public claimPaused = false;
    
    // ============ 事件定义 ============
    
    event EarningDistributed(
        uint256 indexed recordId,
        address indexed author,
        uint256 amount,
        uint256 authorShare,
        uint256 platformShare,
        uint256 levelWeight
    );
    
    event EarningClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event LevelWeightUpdated(
        uint256 indexed level,
        uint256 weight,
        string description
    );
    
    event PlatformWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );
    
    event FeeDistributed(
        address indexed author,
        uint256 authorAmount,
        uint256 platformAmount,
        uint256 timestamp
    );
    
    // ============ 构造函数 ============
    
    constructor(
        address _identityNFT,
        address _platformWallet
    ) ERC20("AGC Token", "AGC") {
        require(_identityNFT != address(0), "AGCToken: invalid identity NFT address");
        require(_platformWallet != address(0), "AGCToken: invalid platform wallet");
        
        identityNFT = IdentityNFT(_identityNFT);
        platformWallet = _platformWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGC_ADMIN, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(FEE_MANAGER, msg.sender);
        
        // 初始化等级权重 (基于IdentityNFT的9个等级)
        _initializeLevelWeights();
    }
    
    // ============ 初始化函数 ============
    
    function _initializeLevelWeights() internal {
        // Level 1: 化神 - 1x
        levelWeights[1] = LevelWeight({
            level: 1,
            weight: 10000,
            description: "Huashen - Base level"
        });
        
        // Level 2: 元婴 - 1.5x
        levelWeights[2] = LevelWeight({
            level: 2,
            weight: 15000,
            description: "Yuanying - 1.5x multiplier"
        });
        
        // Level 3: 金丹 - 2.25x
        levelWeights[3] = LevelWeight({
            level: 3,
            weight: 22500,
            description: "Jindan - 2.25x multiplier"
        });
        
        // Level 4: 筑基 - 3.375x
        levelWeights[4] = LevelWeight({
            level: 4,
            weight: 33750,
            description: "Zhuji - 3.375x multiplier"
        });
        
        // Level 5: 炼气 - 5.07x
        levelWeights[5] = LevelWeight({
            level: 5,
            weight: 50700,
            description: "Lianqi - 5.07x multiplier"
        });
        
        // Level 6: 筑基(巩固) - 7.6x
        levelWeights[6] = LevelWeight({
            level: 6,
            weight: 76000,
            description: "Foundation - 7.6x multiplier"
        });
        
        // Level 7: 核心 - 11.4x
        levelWeights[7] = LevelWeight({
            level: 7,
            weight: 114000,
            description: "Core - 11.4x multiplier"
        });
        
        // Level 8: 元婴(圆满) - 17.1x
        levelWeights[8] = LevelWeight({
            level: 8,
            weight: 171000,
            description: "Nascent Perfection - 17.1x multiplier"
        });
        
        // Level 9: 道祖 - 25.65x
        levelWeights[9] = LevelWeight({
            level: 9,
            weight: 256500,
            description: "Daozu - 25.65x multiplier"
        });
    }
    
    // ============ 核心功能 ============
    
    /**
     * @notice 铸造AGC代币（仅管理员）
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
    
    /**
     * @notice 分配收益（带等级权重）
     * @param author 作者地址
     * @param baseAmount 基础收益金额
     * @param source 来源描述
     */
    function distributeEarning(
        address author,
        uint256 baseAmount,
        string calldata source
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused returns (uint256) {
        require(author != address(0), "AGCToken: invalid author");
        require(baseAmount > 0, "AGCToken: amount must be positive");
        
        // 获取作者的等级权重
        uint256 levelWeight = _getUserLevelWeight(author);
        
        // 计算加权后的收益
        uint256 weightedAmount = (baseAmount * levelWeight) / FEE_PRECISION;
        
        // 计算分配
        uint256 authorShare = (weightedAmount * AUTHOR_SHARE) / FEE_PRECISION;
        uint256 platformShare = (weightedAmount * PLATFORM_SHARE) / FEE_PRECISION;
        
        uint256 recordId = nextRecordId++;
        
        // 记录收益
        earningRecords[recordId] = EarningRecord({
            recordId: recordId,
            author: author,
            amount: weightedAmount,
            authorShare: authorShare,
            platformShare: platformShare,
            levelWeight: levelWeight,
            timestamp: block.timestamp,
            source: source
        });
        
        userEarningRecords[author].push(recordId);
        
        // 更新用户统计
        _updateUserEarnings(author, authorShare);
        
        // 更新总统计
        totalDistributed += weightedAmount;
        totalToAuthors += authorShare;
        totalToPlatform += platformShare;
        
        // 铸造代币
        _mint(author, authorShare);
        _mint(platformWallet, platformShare);
        
        emit EarningDistributed(
            recordId,
            author,
            weightedAmount,
            authorShare,
            platformShare,
            levelWeight
        );
        
        emit FeeDistributed(author, authorShare, platformShare, block.timestamp);
        
        return recordId;
    }
    
    /**
     * @notice 批量分配收益
     */
    function batchDistributeEarnings(
        address[] calldata authors,
        uint256[] calldata amounts,
        string[] calldata sources
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused {
        require(
            authors.length == amounts.length && authors.length == sources.length,
            "AGCToken: array length mismatch"
        );
        
        for (uint256 i = 0; i < authors.length; i++) {
            if (authors[i] != address(0) && amounts[i] > 0) {
                // 获取等级权重
                uint256 levelWeight = _getUserLevelWeight(authors[i]);
                uint256 weightedAmount = (amounts[i] * levelWeight) / FEE_PRECISION;
                
                uint256 authorShare = (weightedAmount * AUTHOR_SHARE) / FEE_PRECISION;
                uint256 platformShare = (weightedAmount * PLATFORM_SHARE) / FEE_PRECISION;
                
                uint256 recordId = nextRecordId++;
                
                earningRecords[recordId] = EarningRecord({
                    recordId: recordId,
                    author: authors[i],
                    amount: weightedAmount,
                    authorShare: authorShare,
                    platformShare: platformShare,
                    levelWeight: levelWeight,
                    timestamp: block.timestamp,
                    source: sources[i]
                });
                
                userEarningRecords[authors[i]].push(recordId);
                _updateUserEarnings(authors[i], authorShare);
                
                totalDistributed += weightedAmount;
                totalToAuthors += authorShare;
                totalToPlatform += platformShare;
                
                _mint(authors[i], authorShare);
                _mint(platformWallet, platformShare);
                
                emit EarningDistributed(
                    recordId,
                    authors[i],
                    weightedAmount,
                    authorShare,
                    platformShare,
                    levelWeight
                );
            }
        }
    }
    
    /**
     * @notice 从交易手续费分配收益
     * @param from 付款方
     * @param amount 手续费金额
     */
    function distributeTransactionFee(
        address from,
        uint256 amount
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused {
        require(from != address(0), "AGCToken: invalid from address");
        require(amount > 0, "AGCToken: amount must be positive");
        require(balanceOf(from) >= amount, "AGCToken: insufficient balance");
        
        // 从付款方扣除
        _burn(from, amount);
        
        // 重新分配：90%给作者池，10%给平台
        uint256 toAuthors = (amount * AUTHOR_SHARE) / FEE_PRECISION;
        uint256 toPlatform = (amount * PLATFORM_SHARE) / FEE_PRECISION;
        
        // 铸造给平台
        _mint(platformWallet, toPlatform);
        
        // 作者池部分由平台后续分配
        totalToPlatform += toPlatform;
        
        emit FeeDistributed(address(0), toAuthors, toPlatform, block.timestamp);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @notice 获取用户的等级权重
     */
    function getUserLevelWeight(address user) external view returns (uint256) {
        return _getUserLevelWeight(user);
    }
    
    function _getUserLevelWeight(address user) internal view returns (uint256) {
        // 检查用户是否有IdentityNFT
        uint256 identityId = identityNFT.getIdentityByOwner(user);
        if (identityId == 0) {
            return defaultWeight;
        }
        
        // 获取等级
        try identityNFT.getLevel(identityId) returns (IdentityNFT.CultivationLevel level) {
            uint256 levelNum = uint256(level) + 1; // 转换为1-9
            LevelWeight storage lw = levelWeights[levelNum];
            return lw.weight > 0 ? lw.weight : defaultWeight;
        } catch {
            return defaultWeight;
        }
    }
    
    /**
     * @notice 获取收益记录
     */
    function getEarningRecord(uint256 recordId) 
        external 
        view 
        returns (EarningRecord memory) 
    {
        require(recordId > 0 && recordId < nextRecordId, "AGCToken: invalid record id");
        return earningRecords[recordId];
    }
    
    /**
     * @notice 获取用户的收益记录列表
     */
    function getUserEarningRecords(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userEarningRecords[user];
    }
    
    /**
     * @notice 获取用户收益统计
     */
    function getUserEarningsStats(address user) 
        external 
        view 
        returns (UserEarnings memory) 
    {
        return userEarnings[user];
    }
    
    /**
     * @notice 计算加权后的收益
     */
    function calculateWeightedEarning(
        address author,
        uint256 baseAmount
    ) external view returns (
        uint256 weightedAmount,
        uint256 authorShare,
        uint256 platformShare,
        uint256 levelWeight
    ) {
        levelWeight = _getUserLevelWeight(author);
        weightedAmount = (baseAmount * levelWeight) / FEE_PRECISION;
        authorShare = (weightedAmount * AUTHOR_SHARE) / FEE_PRECISION;
        platformShare = (weightedAmount * PLATFORM_SHARE) / FEE_PRECISION;
    }
    
    /**
     * @notice 获取等级权重配置
     */
    function getLevelWeight(uint256 level) 
        external 
        view 
        returns (LevelWeight memory) 
    {
        return levelWeights[level];
    }
    
    /**
     * @notice 获取平台统计
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 _totalDistributed,
            uint256 _totalToAuthors,
            uint256 _totalToPlatform,
            uint256 _totalRecords
        ) 
    {
        return (
            totalDistributed,
            totalToAuthors,
            totalToPlatform,
            nextRecordId - 1
        );
    }
    
    /**
     * @notice 获取用户的总收益历史
     */
    function getUserTotalEarnings(address user) 
        external 
        view 
        returns (
            uint256 totalEarned,
            uint256 earningCount,
            uint256 avgEarning
        ) 
    {
        uint256[] storage records = userEarningRecords[user];
        earningCount = records.length;
        
        for (uint256 i = 0; i < earningCount; i++) {
            totalEarned += earningRecords[records[i]].authorShare;
        }
        
        avgEarning = earningCount > 0 ? totalEarned / earningCount : 0;
    }
    
    // ============ 内部函数 ============
    
    function _updateUserEarnings(address user, uint256 amount) internal {
        if (!hasEarnings[user]) {
            userEarnings[user] = UserEarnings({
                user: user,
                totalEarned: 0,
                totalClaimed: 0,
                pendingAmount: 0,
                earningCount: 0,
                lastEarningAt: 0
            });
            hasEarnings[user] = true;
        }
        
        UserEarnings storage earnings = userEarnings[user];
        earnings.totalEarned += amount;
        earnings.pendingAmount += amount;
        earnings.earningCount++;
        earnings.lastEarningAt = block.timestamp;
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @notice 更新等级权重
     */
    function updateLevelWeight(
        uint256 level,
        uint256 weight,
        string calldata description
    ) external onlyRole(AGC_ADMIN) {
        levelWeights[level] = LevelWeight({
            level: level,
            weight: weight,
            description: description
        });
        
        emit LevelWeightUpdated(level, weight, description);
    }
    
    /**
     * @notice 更新默认权重
     */
    function updateDefaultWeight(uint256 weight) external onlyRole(AGC_ADMIN) {
        defaultWeight = weight;
    }
    
    /**
     * @notice 更新平台钱包
     */
    function updatePlatformWallet(address newWallet) external onlyRole(AGC_ADMIN) {
        require(newWallet != address(0), "AGCToken: invalid wallet");
        
        address oldWallet = platformWallet;
        platformWallet = newWallet;
        
        emit PlatformWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @notice 更新IdentityNFT合约地址
     */
    function updateIdentityNFT(address newIdentityNFT) external onlyRole(AGC_ADMIN) {
        require(newIdentityNFT != address(0), "AGCToken: invalid address");
        identityNFT = IdentityNFT(newIdentityNFT);
    }
    
    /**
     * @notice 暂停合约
     */
    function pause() external onlyRole(AGC_ADMIN) {
        _pause();
    }
    
    /**
     * @notice 恢复合约
     */
    function unpause() external onlyRole(AGC_ADMIN) {
        _unpause();
    }
    
    /**
     * @notice 紧急提取（仅限极端情况）
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "AGCToken: invalid recipient");
        
        if (token == address(this)) {
            _mint(to, amount);
        }
        // 对于其他代币，需要额外实现
    }
}