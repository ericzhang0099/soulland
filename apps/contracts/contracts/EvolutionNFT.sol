// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title EvolutionNFT
 * @notice 进化证明NFT合约 - 三种等级（基础/进阶/专家）和进化轨迹记录
 * @dev 用于记录用户在GenLoop平台上的学习进化历程
 */
contract EvolutionNFT is ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant EVOLUTION_ADMIN = keccak256("EVOLUTION_ADMIN");
    bytes32 public constant EVOLUTION_ISSUER = keccak256("EVOLUTION_ISSUER");
    bytes32 public constant TRAJECTORY_MANAGER = keccak256("TRAJECTORY_MANAGER");
    
    // ============ 枚举定义 ============
    
    /**
     * @notice 进化等级
     */
    enum EvolutionLevel {
        Basic,      // 基础
        Advanced,   // 进阶
        Expert      // 专家
    }
    
    /**
     * @notice 进化类型
     */
    enum EvolutionType {
        Learning,       // 学习进化
        Practice,       // 实践进化
        Creation,       // 创作进化
        Teaching,       // 教学进化
        Mastery,        // 精通进化
        Innovation      // 创新进化
    }
    
    // ============ 结构体定义 ============
    
    /**
     * @notice 进化NFT数据
     */
    struct Evolution {
        uint256 tokenId;
        address owner;
        EvolutionLevel level;
        EvolutionType evolutionType;
        string title;
        string description;
        uint256 achievedAt;
        uint256 score;              // 进化分数 (0-10000)
        bytes32 achievementHash;    // 成就哈希
        string metadataURI;
        bool isVerified;
    }
    
    /**
     * @notice 进化轨迹点
     */
    struct TrajectoryPoint {
        uint256 pointId;
        uint256 evolutionId;
        uint256 timestamp;
        string milestone;           // 里程碑描述
        uint256 scoreDelta;         // 分数变化
        string evidenceURI;         // 证据URI
        address recordedBy;         // 记录者
    }
    
    /**
     * @notice 用户进化统计
     */
    struct UserEvolutionStats {
        address user;
        uint256 totalEvolutions;
        uint256 basicCount;
        uint256 advancedCount;
        uint256 expertCount;
        uint256 totalScore;
        uint256 highestScore;
        uint256 firstEvolutionAt;
        uint256 lastEvolutionAt;
    }
    
    /**
     * @notice 等级要求配置
     */
    struct LevelRequirement {
        uint256 minScore;
        uint256 requiredBasicCount;     // 需要的基础进化数
        uint256 requiredAdvancedCount;  // 需要的进阶进化数
        uint256 requiredExpertCount;    // 需要的专家进化数
        string badgeURI;                // 徽章URI
    }
    
    // ============ 状态变量 ============
    
    // 进化NFT数据
    mapping(uint256 => Evolution) public evolutions;
    mapping(address => uint256[]) public userEvolutions;
    mapping(bytes32 => bool) public achievementHashExists;
    
    // 进化轨迹
    mapping(uint256 => TrajectoryPoint[]) public evolutionTrajectories;
    mapping(uint256 => uint256) public nextPointId;
    
    // 用户统计
    mapping(address => UserEvolutionStats) public userStats;
    mapping(address => bool) public hasStats;
    
    // 等级要求
    mapping(EvolutionLevel => LevelRequirement) public levelRequirements;
    
    // 计数器
    uint256 public nextTokenId = 1;
    uint256 public totalEvolutions;
    
    // 平台参数
    uint256 public constant MAX_SCORE = 10000;
    uint256 public minTrajectoryPoints = 3;     // 最小轨迹点数
    uint256 public trajectoryCooldown = 1 days; // 轨迹记录冷却
    
    // ============ 事件定义 ============
    
    event EvolutionMinted(
        uint256 indexed tokenId,
        address indexed owner,
        EvolutionLevel level,
        EvolutionType evolutionType,
        uint256 score,
        uint256 timestamp
    );
    
    event TrajectoryPointAdded(
        uint256 indexed pointId,
        uint256 indexed evolutionId,
        string milestone,
        uint256 scoreDelta,
        uint256 timestamp
    );
    
    event EvolutionVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event LevelUpgraded(
        uint256 indexed tokenId,
        EvolutionLevel oldLevel,
        EvolutionLevel newLevel,
        uint256 timestamp
    );
    
    event UserStatsUpdated(
        address indexed user,
        uint256 totalEvolutions,
        uint256 totalScore,
        uint256 timestamp
    );
    
    // ============ 构造函数 ============
    
    constructor() ERC721("GenLoop Evolution", "GLEVO") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EVOLUTION_ADMIN, msg.sender);
        _grantRole(EVOLUTION_ISSUER, msg.sender);
        _grantRole(TRAJECTORY_MANAGER, msg.sender);
        
        // 初始化等级要求
        _initializeLevelRequirements();
    }
    
    // ============ 初始化函数 ============
    
    function _initializeLevelRequirements() internal {
        // 基础等级要求
        levelRequirements[EvolutionLevel.Basic] = LevelRequirement({
            minScore: 0,
            requiredBasicCount: 0,
            requiredAdvancedCount: 0,
            requiredExpertCount: 0,
            badgeURI: "ipfs://basic-badge"
        });
        
        // 进阶等级要求
        levelRequirements[EvolutionLevel.Advanced] = LevelRequirement({
            minScore: 3000,
            requiredBasicCount: 2,
            requiredAdvancedCount: 0,
            requiredExpertCount: 0,
            badgeURI: "ipfs://advanced-badge"
        });
        
        // 专家等级要求
        levelRequirements[EvolutionLevel.Expert] = LevelRequirement({
            minScore: 7000,
            requiredBasicCount: 3,
            requiredAdvancedCount: 2,
            requiredExpertCount: 0,
            badgeURI: "ipfs://expert-badge"
        });
    }
    
    // ============ 修饰器 ============
    
    modifier evolutionExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "EvolutionNFT: evolution does not exist");
        _;
    }
    
    modifier onlyEvolutionOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "EvolutionNFT: not evolution owner");
        _;
    }
    
    // ============ 核心功能 ============
    
    /**
     * @notice 铸造进化NFT
     * @param to 接收地址
     * @param level 进化等级
     * @param evolutionType 进化类型
     * @param title 标题
     * @param description 描述
     * @param score 进化分数
     * @param achievementHash 成就哈希
     * @param metadataURI 元数据URI
     */
    function mintEvolution(
        address to,
        EvolutionLevel level,
        EvolutionType evolutionType,
        string calldata title,
        string calldata description,
        uint256 score,
        bytes32 achievementHash,
        string calldata metadataURI
    ) external onlyRole(EVOLUTION_ISSUER) nonReentrant whenNotPaused returns (uint256) {
        require(to != address(0), "EvolutionNFT: invalid recipient");
        require(score <= MAX_SCORE, "EvolutionNFT: score exceeds max");
        require(!achievementHashExists[achievementHash], "EvolutionNFT: achievement already exists");
        require(bytes(title).length > 0, "EvolutionNFT: title required");
        
        // 检查等级要求
        require(_checkLevelRequirements(to, level), "EvolutionNFT: level requirements not met");
        
        uint256 tokenId = nextTokenId++;
        
        evolutions[tokenId] = Evolution({
            tokenId: tokenId,
            owner: to,
            level: level,
            evolutionType: evolutionType,
            title: title,
            description: description,
            achievedAt: block.timestamp,
            score: score,
            achievementHash: achievementHash,
            metadataURI: metadataURI,
            isVerified: false
        });
        
        achievementHashExists[achievementHash] = true;
        userEvolutions[to].push(tokenId);
        totalEvolutions++;
        
        // 初始化轨迹
        nextPointId[tokenId] = 1;
        
        // 更新用户统计
        _updateUserStats(to, level, score);
        
        // 铸造NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit EvolutionMinted(tokenId, to, level, evolutionType, score, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @notice 添加进化轨迹点
     * @param evolutionId 进化NFT ID
     * @param milestone 里程碑描述
     * @param scoreDelta 分数变化
     * @param evidenceURI 证据URI
     */
    function addTrajectoryPoint(
        uint256 evolutionId,
        string calldata milestone,
        uint256 scoreDelta,
        string calldata evidenceURI
    ) external onlyRole(TRAJECTORY_MANAGER) evolutionExists(evolutionId) returns (uint256) {
        require(bytes(milestone).length > 0, "EvolutionNFT: milestone required");
        
        uint256 pointId = nextPointId[evolutionId]++;
        
        evolutionTrajectories[evolutionId].push(TrajectoryPoint({
            pointId: pointId,
            evolutionId: evolutionId,
            timestamp: block.timestamp,
            milestone: milestone,
            scoreDelta: scoreDelta,
            evidenceURI: evidenceURI,
            recordedBy: msg.sender
        }));
        
        // 更新进化分数
        Evolution storage evolution = evolutions[evolutionId];
        uint256 newScore = evolution.score + scoreDelta;
        if (newScore > MAX_SCORE) newScore = MAX_SCORE;
        evolution.score = newScore;
        
        emit TrajectoryPointAdded(pointId, evolutionId, milestone, scoreDelta, block.timestamp);
        
        return pointId;
    }
    
    /**
     * @notice 批量添加轨迹点
     */
    function batchAddTrajectoryPoints(
        uint256 evolutionId,
        string[] calldata milestones,
        uint256[] calldata scoreDeltas,
        string[] calldata evidenceURIs
    ) external onlyRole(TRAJECTORY_MANAGER) evolutionExists(evolutionId) {
        require(
            milestones.length == scoreDeltas.length && 
            milestones.length == evidenceURIs.length,
            "EvolutionNFT: array length mismatch"
        );
        
        for (uint256 i = 0; i < milestones.length; i++) {
            uint256 pointId = nextPointId[evolutionId]++;
            
            evolutionTrajectories[evolutionId].push(TrajectoryPoint({
                pointId: pointId,
                evolutionId: evolutionId,
                timestamp: block.timestamp,
                milestone: milestones[i],
                scoreDelta: scoreDeltas[i],
                evidenceURI: evidenceURIs[i],
                recordedBy: msg.sender
            }));
            
            // 更新进化分数
            Evolution storage evolution = evolutions[evolutionId];
            uint256 newScore = evolution.score + scoreDeltas[i];
            if (newScore > MAX_SCORE) newScore = MAX_SCORE;
            evolution.score = newScore;
            
            emit TrajectoryPointAdded(pointId, evolutionId, milestones[i], scoreDeltas[i], block.timestamp);
        }
    }
    
    /**
     * @notice 验证进化NFT
     */
    function verifyEvolution(
        uint256 tokenId
    ) external onlyRole(EVOLUTION_ISSUER) evolutionExists(tokenId) {
        evolutions[tokenId].isVerified = true;
        emit EvolutionVerified(tokenId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice 升级进化等级
     */
    function upgradeLevel(
        uint256 tokenId,
        EvolutionLevel newLevel
    ) external onlyRole(EVOLUTION_ISSUER) evolutionExists(tokenId) {
        Evolution storage evolution = evolutions[tokenId];
        require(uint256(newLevel) > uint256(evolution.level), "EvolutionNFT: can only upgrade");
        require(
            _checkLevelRequirements(evolution.owner, newLevel),
            "EvolutionNFT: level requirements not met"
        );
        
        EvolutionLevel oldLevel = evolution.level;
        evolution.level = newLevel;
        
        emit LevelUpgraded(tokenId, oldLevel, newLevel, block.timestamp);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @notice 获取进化NFT详情
     */
    function getEvolution(uint256 tokenId) 
        external 
        view 
        evolutionExists(tokenId) 
        returns (Evolution memory) 
    {
        return evolutions[tokenId];
    }
    
    /**
     * @notice 获取用户的所有进化NFT
     */
    function getUserEvolutions(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userEvolutions[user];
    }
    
    /**
     * @notice 获取进化轨迹
     */
    function getTrajectory(uint256 evolutionId) 
        external 
        view 
        evolutionExists(evolutionId) 
        returns (TrajectoryPoint[] memory) 
    {
        return evolutionTrajectories[evolutionId];
    }
    
    /**
     * @notice 获取轨迹点详情
     */
    function getTrajectoryPoint(uint256 evolutionId, uint256 pointId) 
        external 
        view 
        evolutionExists(evolutionId) 
        returns (TrajectoryPoint memory) 
    {
        require(pointId > 0 && pointId < nextPointId[evolutionId], "EvolutionNFT: invalid point id");
        return evolutionTrajectories[evolutionId][pointId - 1];
    }
    
    /**
     * @notice 获取用户统计
     */
    function getUserStats(address user) 
        external 
        view 
        returns (UserEvolutionStats memory) 
    {
        return userStats[user];
    }
    
    /**
     * @notice 获取等级要求
     */
    function getLevelRequirement(EvolutionLevel level) 
        external 
        view 
        returns (LevelRequirement memory) 
    {
        return levelRequirements[level];
    }
    
    /**
     * @notice 获取用户各等级进化数量
     */
    function getUserLevelCounts(address user) 
        external 
        view 
        returns (
            uint256 basicCount,
            uint256 advancedCount,
            uint256 expertCount
        ) 
    {
        uint256[] storage evoIds = userEvolutions[user];
        
        for (uint256 i = 0; i < evoIds.length; i++) {
            EvolutionLevel level = evolutions[evoIds[i]].level;
            if (level == EvolutionLevel.Basic) basicCount++;
            else if (level == EvolutionLevel.Advanced) advancedCount++;
            else if (level == EvolutionLevel.Expert) expertCount++;
        }
    }
    
    /**
     * @notice 获取用户特定类型的进化
     */
    function getUserEvolutionsByType(
        address user,
        EvolutionType evolutionType
    ) external view returns (uint256[] memory) {
        uint256[] storage evoIds = userEvolutions[user];
        uint256[] memory temp = new uint256[](evoIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < evoIds.length; i++) {
            if (evolutions[evoIds[i]].evolutionType == evolutionType) {
                temp[count++] = evoIds[i];
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    /**
     * @notice 检查用户是否满足等级要求
     */
    function _checkLevelRequirements(
        address user,
        EvolutionLevel level
    ) internal view returns (bool) {
        if (level == EvolutionLevel.Basic) return true;
        
        LevelRequirement storage req = levelRequirements[level];
        
        uint256 basicCount = 0;
        uint256 advancedCount = 0;
        uint256 expertCount = 0;
        uint256 totalScore = 0;
        
        uint256[] storage evoIds = userEvolutions[user];
        
        for (uint256 i = 0; i < evoIds.length; i++) {
            Evolution storage evolution = evolutions[evoIds[i]];
            totalScore += evolution.score;
            
            if (evolution.level == EvolutionLevel.Basic) basicCount++;
            else if (evolution.level == EvolutionLevel.Advanced) advancedCount++;
            else if (evolution.level == EvolutionLevel.Expert) expertCount++;
        }
        
        return (
            totalScore >= req.minScore &&
            basicCount >= req.requiredBasicCount &&
            advancedCount >= req.requiredAdvancedCount &&
            expertCount >= req.requiredExpertCount
        );
    }
    
    /**
     * @notice 检查用户是否满足等级要求（外部调用）
     */
    function checkLevelRequirements(
        address user,
        EvolutionLevel level
    ) external view returns (bool) {
        return _checkLevelRequirements(user, level);
    }
    
    /**
     * @notice 获取进化的完整轨迹摘要
     */
    function getTrajectorySummary(uint256 evolutionId) 
        external 
        view 
        evolutionExists(evolutionId) 
        returns (
            uint256 totalPoints,
            uint256 totalScoreDelta,
            uint256 firstPointAt,
            uint256 lastPointAt
        ) 
    {
        TrajectoryPoint[] storage points = evolutionTrajectories[evolutionId];
        totalPoints = points.length;
        
        if (totalPoints == 0) return (0, 0, 0, 0);
        
        for (uint256 i = 0; i < totalPoints; i++) {
            totalScoreDelta += points[i].scoreDelta;
        }
        
        firstPointAt = points[0].timestamp;
        lastPointAt = points[totalPoints - 1].timestamp;
    }
    
    // ============ 内部函数 ============
    
    function _updateUserStats(
        address user,
        EvolutionLevel level,
        uint256 score
    ) internal {
        if (!hasStats[user]) {
            userStats[user] = UserEvolutionStats({
                user: user,
                totalEvolutions: 0,
                basicCount: 0,
                advancedCount: 0,
                expertCount: 0,
                totalScore: 0,
                highestScore: 0,
                firstEvolutionAt: block.timestamp,
                lastEvolutionAt: block.timestamp
            });
            hasStats[user] = true;
        }
        
        UserEvolutionStats storage stats = userStats[user];
        stats.totalEvolutions++;
        stats.totalScore += score;
        stats.lastEvolutionAt = block.timestamp;
        
        if (score > stats.highestScore) {
            stats.highestScore = score;
        }
        
        if (level == EvolutionLevel.Basic) stats.basicCount++;
        else if (level == EvolutionLevel.Advanced) stats.advancedCount++;
        else if (level == EvolutionLevel.Expert) stats.expertCount++;
        
        emit UserStatsUpdated(user, stats.totalEvolutions, stats.totalScore, block.timestamp);
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @notice 更新等级要求
     */
    function updateLevelRequirement(
        EvolutionLevel level,
        uint256 minScore,
        uint256 requiredBasicCount,
        uint256 requiredAdvancedCount,
        uint256 requiredExpertCount,
        string calldata badgeURI
    ) external onlyRole(EVOLUTION_ADMIN) {
        levelRequirements[level] = LevelRequirement({
            minScore: minScore,
            requiredBasicCount: requiredBasicCount,
            requiredAdvancedCount: requiredAdvancedCount,
            requiredExpertCount: requiredExpertCount,
            badgeURI: badgeURI
        });
    }
    
    /**
     * @notice 设置最小轨迹点数
     */
    function setMinTrajectoryPoints(uint256 minPoints) external onlyRole(EVOLUTION_ADMIN) {
        minTrajectoryPoints = minPoints;
    }
    
    /**
     * @notice 设置轨迹记录冷却
     */
    function setTrajectoryCooldown(uint256 cooldown) external onlyRole(EVOLUTION_ADMIN) {
        trajectoryCooldown = cooldown;
    }
    
    /**
     * @notice 更新进化元数据
     */
    function updateEvolutionMetadata(
        uint256 tokenId,
        string calldata newURI
    ) external onlyRole(EVOLUTION_ADMIN) evolutionExists(tokenId) {
        _setTokenURI(tokenId, newURI);
        evolutions[tokenId].metadataURI = newURI;
    }
    
    /**
     * @notice 暂停合约
     */
    function pause() external onlyRole(EVOLUTION_ADMIN) {
        _pause();
    }
    
    /**
     * @notice 恢复合约
     */
    function unpause() external onlyRole(EVOLUTION_ADMIN) {
        _unpause();
    }
    
    // ============ 重写函数 ============
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        
        // 更新所有者
        if (to != address(0)) {
            evolutions[tokenId].owner = to;
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