// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IdentityNFT.sol";
import "./InstructorNFT.sol";
import "./EvolutionNFT.sol";
import "./AGCToken.sol";

// 2.0 合约接口
interface IGeneToken {
    function balanceOf(address owner) external view returns (uint256);
}

interface IGeneRegistry {
    function getGene(uint256 geneId) external view returns (bytes memory);
}

interface IGeneExchange {
    function orders(uint256 orderId) external view returns (bytes memory);
}

/**
 * @title GenLoop30Core
 * @notice GenLoop 3.0 核心集成合约 - 连接2.0和3.0合约
 * @dev 集成IdentityNFT、InstructorNFT、EvolutionNFT和AGCToken
 */
contract GenLoop30Core {
    
    // 2.0 合约
    IGeneToken public geneToken;
    IGeneRegistry public geneRegistry;
    IGeneExchange public geneExchange;
    
    // 3.0 合约
    IdentityNFT public identityNFT;
    InstructorNFT public instructorNFT;
    EvolutionNFT public evolutionNFT;
    AGCToken public agcToken;
    
    address public admin;
    
    // 角色定义
    bytes32 public constant CORE_ADMIN = keccak256("CORE_ADMIN");
    bytes32 public constant USER_MANAGER = keccak256("USER_MANAGER");
    bytes32 public constant EVOLUTION_RECORDER = keccak256("EVOLUTION_RECORDER");
    
    // 平台参数
    uint256 public initialAGCAmount = 1000 * 10**18; // 初始AGC奖励
    uint256 public evolutionRewardBase = 100 * 10**18; // 进化基础奖励
    
    // 事件
    event UserRegistered(
        address indexed user, 
        uint256 identityTokenId, 
        uint256 initialAGC,
        uint256 timestamp
    );
    
    event GeneListed(
        address indexed seller, 
        uint256 indexed geneId, 
        uint256 price,
        uint256 timestamp
    );
    
    event GenePurchased(
        address indexed buyer, 
        address indexed seller, 
        uint256 indexed geneId, 
        uint256 price,
        uint256 authorShare,
        uint256 platformShare,
        uint256 timestamp
    );
    
    event EvolutionCertified(
        address indexed agent, 
        uint256 indexed evolutionTokenId, 
        EvolutionNFT.EvolutionLevel level,
        uint256 rewardAmount,
        uint256 timestamp
    );
    
    event InstructorCertified(
        address indexed instructor,
        uint256 indexed startTokenId,
        uint256 indexed termId,
        InstructorNFT.InstructorLevel level,
        uint256 timestamp
    );
    
    event ContributionRecorded(
        address indexed user,
        uint256 indexed identityId,
        uint256 contributionAmount,
        uint256 timestamp
    );
    
    event ContractsUpdated(
        address indexed geneToken,
        address indexed geneRegistry,
        address indexed geneExchange,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "GenLoop30Core: not admin");
        _;
    }
    
    modifier onlyRole(bytes32 role) {
        require(
            identityNFT.hasRole(role, msg.sender) || 
            msg.sender == admin,
            "GenLoop30Core: unauthorized"
        );
        _;
    }

    constructor(
        address _geneToken,
        address _geneRegistry,
        address _geneExchange,
        address _identityNFT,
        address _instructorNFT,
        address _evolutionNFT,
        address _agcToken
    ) {
        require(_geneToken != address(0), "GenLoop30Core: invalid GeneToken");
        require(_geneRegistry != address(0), "GenLoop30Core: invalid GeneRegistry");
        require(_geneExchange != address(0), "GenLoop30Core: invalid GeneExchange");
        require(_identityNFT != address(0), "GenLoop30Core: invalid IdentityNFT");
        require(_instructorNFT != address(0), "GenLoop30Core: invalid InstructorNFT");
        require(_evolutionNFT != address(0), "GenLoop30Core: invalid EvolutionNFT");
        require(_agcToken != address(0), "GenLoop30Core: invalid AGCToken");
        
        geneToken = IGeneToken(_geneToken);
        geneRegistry = IGeneRegistry(_geneRegistry);
        geneExchange = IGeneExchange(_geneExchange);
        identityNFT = IdentityNFT(_identityNFT);
        instructorNFT = InstructorNFT(_instructorNFT);
        evolutionNFT = EvolutionNFT(_evolutionNFT);
        agcToken = AGCToken(_agcToken);
        
        admin = msg.sender;
    }
    
    /**
     * @notice 用户注册 - 铸造身份NFT并发放初始AGC
     * @param to 接收地址
     * @param initialScore 初始积分
     * @param metadataURI 元数据URI
     * @return identityTokenId 铸造的身份NFT ID
     */
    function registerUser(
        address to,
        uint256 initialScore,
        string calldata metadataURI
    ) external onlyRole(USER_MANAGER) returns (uint256) {
        require(to != address(0), "GenLoop30Core: invalid address");
        require(!identityNFT.hasIdentity(to), "GenLoop30Core: user already registered");
        
        // 铸造身份NFT
        uint256 identityTokenId = identityNFT.mintIdentity(to, initialScore, metadataURI);
        
        // 发放初始AGC
        agcToken.mint(to, initialAGCAmount);
        
        emit UserRegistered(to, identityTokenId, initialAGCAmount, block.timestamp);
        
        return identityTokenId;
    }
    
    /**
     * @notice 批量注册用户 - 简化版
     */
    function batchRegisterUsers(
        address[] calldata users,
        uint256[] calldata initialScores,
        string[] calldata metadataURIs
    ) external onlyRole(USER_MANAGER) returns (uint256[] memory) {
        uint256 len = users.length;
        require(len == initialScores.length, "GenLoop30Core: array length mismatch");
        require(len == metadataURIs.length, "GenLoop30Core: array length mismatch");
        
        uint256[] memory tokenIds = new uint256[](len);
        
        for (uint256 i = 0; i < len; i++) {
            if (!identityNFT.hasIdentity(users[i])) {
                tokenIds[i] = identityNFT.mintIdentity(users[i], initialScores[i], metadataURIs[i]);
                agcToken.mint(users[i], initialAGCAmount);
                emit UserRegistered(users[i], tokenIds[i], initialAGCAmount, block.timestamp);
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @notice 认证教员 - 创建档案并颁发开始NFT
     * @param instructor 教员地址
     * @param name 教员名称
     * @param bio 简介
     * @param expertise 专业领域
     * @param level 教员等级
     * @param termDuration 任期时长
     * @param courseCategory 课程类别
     * @param metadataURI 元数据URI
     * @return startTokenId 颁发的开始NFT ID
     */
    function certifyInstructor(
        address instructor,
        string calldata name,
        string calldata bio,
        string calldata expertise,
        InstructorNFT.InstructorLevel level,
        uint256 termDuration,
        string calldata courseCategory,
        string calldata metadataURI
    ) external onlyRole(USER_MANAGER) returns (uint256) {
        require(instructor != address(0), "GenLoop30Core: invalid instructor");
        require(identityNFT.hasIdentity(instructor), "GenLoop30Core: instructor must have identity");
        
        // 创建教员档案（如果不存在）
        if (!instructorNFT.hasProfile(instructor)) {
            instructorNFT.createProfile(instructor, name, bio, expertise);
        }
        
        // 颁发开始NFT
        uint256 startTokenId = instructorNFT.issueStartNFT(
            instructor,
            level,
            termDuration,
            courseCategory,
            metadataURI
        );
        
        // 获取任期ID
        uint256 termId = instructorNFT.startNFTToTerm(startTokenId);
        
        emit InstructorCertified(instructor, startTokenId, termId, level, block.timestamp);
        
        return startTokenId;
    }
    
    /**
     * @notice 完成教员任期 - 颁发结束NFT
     * @param startTokenId 开始NFT ID
     * @param achievement 成就描述
     * @param metadataURI 元数据URI
     * @return endTokenId 颁发的结束NFT ID
     */
    function completeInstructorTerm(
        uint256 startTokenId,
        string calldata achievement,
        string calldata metadataURI
    ) external onlyRole(USER_MANAGER) returns (uint256) {
        uint256 endTokenId = instructorNFT.issueEndNFT(startTokenId, achievement, metadataURI);
        return endTokenId;
    }
    
    /**
     * @notice 记录进化并颁发证明
     * @param to 接收地址
     * @param level 进化等级
     * @param evolutionType 进化类型
     * @param title 标题
     * @param description 描述
     * @param score 进化分数
     * @param achievementHash 成就哈希
     * @param metadataURI 元数据URI
     * @return evolutionTokenId 铸造的进化NFT ID
     */
    function recordEvolution(
        address to,
        EvolutionNFT.EvolutionLevel level,
        EvolutionNFT.EvolutionType evolutionType,
        string calldata title,
        string calldata description,
        uint256 score,
        bytes32 achievementHash,
        string calldata metadataURI
    ) external onlyRole(EVOLUTION_RECORDER) returns (uint256) {
        require(to != address(0), "GenLoop30Core: invalid address");
        require(identityNFT.hasIdentity(to), "GenLoop30Core: user must have identity");
        
        // 铸造进化NFT
        uint256 evolutionTokenId = evolutionNFT.mintEvolution(
            to,
            level,
            evolutionType,
            title,
            description,
            score,
            achievementHash,
            metadataURI
        );
        
        // 计算并发放进化奖励
        uint256 reward = (evolutionRewardBase * (uint256(level) + 1)) / 1;
        agcToken.mint(to, reward);
        
        // 更新用户贡献值
        uint256 identityId = identityNFT.getIdentityByOwner(to);
        if (identityId != 0) {
            identityNFT.addContribution(identityId, score / 100);
            
            emit ContributionRecorded(to, identityId, score / 100, block.timestamp);
        }
        
        emit EvolutionCertified(to, evolutionTokenId, level, reward, block.timestamp);
        
        return evolutionTokenId;
    }
    
    /**
     * @notice 批量记录进化 - 简化版
     */
    function batchRecordEvolutions(
        address[] calldata users,
        EvolutionNFT.EvolutionLevel[] calldata levels,
        EvolutionNFT.EvolutionType[] calldata evolutionTypes,
        string[] calldata titles,
        string[] calldata descriptions,
        uint256[] calldata scores,
        bytes32[] calldata achievementHashes,
        string[] calldata metadataURIs
    ) external onlyRole(EVOLUTION_RECORDER) returns (uint256[] memory) {
        uint256 len = users.length;
        require(len == levels.length, "GenLoop30Core: array length mismatch");
        require(len == evolutionTypes.length, "GenLoop30Core: array length mismatch");
        require(len == titles.length, "GenLoop30Core: array length mismatch");
        
        uint256[] memory tokenIds = new uint256[](len);
        
        for (uint256 i = 0; i < len; i++) {
            if (identityNFT.hasIdentity(users[i])) {
                tokenIds[i] = evolutionNFT.mintEvolution(
                    users[i],
                    levels[i],
                    evolutionTypes[i],
                    titles[i],
                    descriptions[i],
                    scores[i],
                    achievementHashes[i],
                    metadataURIs[i]
                );
                
                uint256 reward = (evolutionRewardBase * (uint256(levels[i]) + 1)) / 1;
                agcToken.mint(users[i], reward);
                
                uint256 identityId = identityNFT.getIdentityByOwner(users[i]);
                if (identityId != 0) {
                    identityNFT.addContribution(identityId, scores[i] / 100);
                }
                
                emit EvolutionCertified(users[i], tokenIds[i], levels[i], reward, block.timestamp);
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @notice 分配收益给作者（带等级权重）
     * @param author 作者地址
     * @param baseAmount 基础收益金额
     * @param source 来源描述
     * @return recordId 收益记录ID
     */
    function distributeEarning(
        address author,
        uint256 baseAmount,
        string calldata source
    ) external onlyRole(USER_MANAGER) returns (uint256) {
        return agcToken.distributeEarning(author, baseAmount, source);
    }
    
    /**
     * @notice 批量分配收益
     */
    function batchDistributeEarnings(
        address[] calldata authors,
        uint256[] calldata amounts,
        string[] calldata sources
    ) external onlyRole(USER_MANAGER) {
        agcToken.batchDistributeEarnings(authors, amounts, sources);
    }
    
    /**
     * @notice 获取用户完整信息 - 简化版
     */
    function getUserInfo(address user) external view returns (
        IdentityNFT.Identity memory identity,
        uint256 agcBalance,
        uint256 geneCount,
        bool isInstructor,
        uint256 evolutionCount,
        string memory identityLevel
    ) {
        uint256 identityId = identityNFT.getIdentityByOwner(user);
        
        if (identityId != 0) {
            identity = identityNFT.getIdentity(identityId);
            identityLevel = identityNFT.getLevelName(identityId);
        }
        
        agcBalance = agcToken.balanceOf(user);
        geneCount = geneToken.balanceOf(user);
        isInstructor = instructorNFT.hasActiveTerm(user);
        evolutionCount = evolutionNFT.balanceOf(user);
    }
    
    /**
     * @notice 获取平台统计信息 - 简化版
     */
    function getPlatformStats() external view returns (
        uint256 totalIdentities,
        uint256 totalInstructors,
        uint256 totalEvolutions,
        uint256 totalAGCDistributed,
        uint256 totalAGCToAuthors,
        uint256 totalAGCToPlatform
    ) {
        totalIdentities = identityNFT.totalIdentities();
        totalEvolutions = evolutionNFT.totalEvolutions();
        
        uint256 distributed;
        uint256 toAuthors;
        uint256 toPlatform;
        uint256 records;
        
        (distributed, toAuthors, toPlatform, records) = agcToken.getPlatformStats();
        
        totalAGCDistributed = distributed;
        totalAGCToAuthors = toAuthors;
        totalAGCToPlatform = toPlatform;
    }
    
    /**
     * @notice 更新2.0合约地址
     */
    function update20Contracts(
        address _geneToken,
        address _geneRegistry,
        address _geneExchange
    ) external onlyAdmin {
        require(_geneToken != address(0), "GenLoop30Core: invalid address");
        require(_geneRegistry != address(0), "GenLoop30Core: invalid address");
        require(_geneExchange != address(0), "GenLoop30Core: invalid address");
        
        geneToken = IGeneToken(_geneToken);
        geneRegistry = IGeneRegistry(_geneRegistry);
        geneExchange = IGeneExchange(_geneExchange);
        
        emit ContractsUpdated(_geneToken, _geneRegistry, _geneExchange, block.timestamp);
    }
    
    /**
     * @notice 更新3.0合约地址
     */
    function update30Contracts(
        address _identityNFT,
        address _instructorNFT,
        address _evolutionNFT,
        address _agcToken
    ) external onlyAdmin {
        require(_identityNFT != address(0), "GenLoop30Core: invalid address");
        require(_instructorNFT != address(0), "GenLoop30Core: invalid address");
        require(_evolutionNFT != address(0), "GenLoop30Core: invalid address");
        require(_agcToken != address(0), "GenLoop30Core: invalid address");
        
        identityNFT = IdentityNFT(_identityNFT);
        instructorNFT = InstructorNFT(_instructorNFT);
        evolutionNFT = EvolutionNFT(_evolutionNFT);
        agcToken = AGCToken(_agcToken);
    }
    
    /**
     * @notice 更新平台参数
     */
    function updatePlatformParams(
        uint256 _initialAGCAmount,
        uint256 _evolutionRewardBase
    ) external onlyAdmin {
        initialAGCAmount = _initialAGCAmount;
        evolutionRewardBase = _evolutionRewardBase;
    }
    
    /**
     * @notice 转移管理员权限
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "GenLoop30Core: invalid address");
        admin = newAdmin;
    }
    
    /**
     * @notice 授予核心角色
     */
    function grantCoreRole(bytes32 role, address account) external onlyAdmin {
        identityNFT.grantRole(role, account);
        instructorNFT.grantRole(role, account);
        evolutionNFT.grantRole(role, account);
        agcToken.grantRole(role, account);
    }
    
    /**
     * @notice 撤销核心角色
     */
    function revokeCoreRole(bytes32 role, address account) external onlyAdmin {
        identityNFT.revokeRole(role, account);
        instructorNFT.revokeRole(role, account);
        evolutionNFT.revokeRole(role, account);
        agcToken.revokeRole(role, account);
    }
}
