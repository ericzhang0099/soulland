// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title InstructorNFT
 * @notice 教员NFT合约 - 双NFT机制（开始+结束）和任期管理
 * @dev 用于管理GenLoop平台教员的认证和任期
 */
contract InstructorNFT is ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant INSTRUCTOR_ADMIN = keccak256("INSTRUCTOR_ADMIN");
    bytes32 public constant INSTRUCTOR_MANAGER = keccak256("INSTRUCTOR_MANAGER");
    bytes32 public constant CERTIFICATION_ISSUER = keccak256("CERTIFICATION_ISSUER");
    
    // ============ 枚举定义 ============
    
    /**
     * @notice NFT类型
     */
    enum NFTType {
        Start,      // 开始NFT - 任命时发放
        End         // 结束NFT - 任期结束时发放
    }
    
    /**
     * @notice 教员状态
     */
    enum InstructorStatus {
        Pending,        // 待审核
        Active,         // 任职中
        Suspended,      // 暂停
        Completed,      // 已完成任期
        Revoked         // 已撤销
    }
    
    /**
     * @notice 教员等级
     */
    enum InstructorLevel {
        Junior,         // 初级教员
        Intermediate,   // 中级教员
        Senior,         // 高级教员
        Expert,         // 专家教员
        Master          // 大师教员
    }
    
    // ============ 结构体定义 ============
    
    /**
     * @notice 开始NFT数据
     */
    struct StartNFT {
        uint256 tokenId;
        address instructor;         // 教员地址
        InstructorLevel level;      // 教员等级
        uint256 appointedAt;        // 任命时间
        uint256 termStart;          // 任期开始
        uint256 termEnd;            // 任期结束 (0表示无限期)
        string courseCategory;      // 课程类别
        string metadataURI;         // 元数据URI
    }
    
    /**
     * @notice 结束NFT数据
     */
    struct EndNFT {
        uint256 tokenId;
        uint256 startTokenId;       // 对应的开始NFT ID
        address instructor;         // 教员地址
        uint256 completedAt;        // 完成时间
        uint256 totalStudents;      // 总教学生数
        uint256 totalCourses;       // 总课程数
        uint256 rating;             // 评分 (0-500, 5.0分制)
        string achievement;         // 成就描述
        string metadataURI;         // 元数据URI
    }
    
    /**
     * @notice 教员任期记录
     */
    struct InstructorTerm {
        uint256 termId;
        address instructor;
        uint256 startNFTId;
        uint256 endNFTId;           // 0表示尚未结束
        uint256 startTime;
        uint256 endTime;            // 0表示尚未结束
        InstructorStatus status;
        InstructorLevel level;
        uint256 studentCount;
        uint256 courseCount;
        uint256 totalRatingSum;     // 评分总和
        uint256 ratingCount;        // 评分次数
    }
    
    /**
     * @notice 教员档案
     */
    struct InstructorProfile {
        address instructor;
        string name;
        string bio;
        string expertise;           // 专业领域
        uint256 totalTerms;         // 总任期数
        uint256 totalStudents;      // 总教学生数
        uint256 totalCourses;       // 总课程数
        uint256 averageRating;      // 平均评分
        bool isVerified;            // 是否已验证
        uint256 createdAt;
    }
    
    // ============ 状态变量 ============
    
    // NFT数据存储
    mapping(uint256 => StartNFT) public startNFTs;
    mapping(uint256 => EndNFT) public endNFTs;
    mapping(uint256 => NFTType) public tokenTypes;
    
    // 任期记录
    mapping(uint256 => InstructorTerm) public terms;
    mapping(address => uint256[]) public instructorTerms;
    mapping(uint256 => uint256) public startNFTToTerm;
    
    // 教员档案
    mapping(address => InstructorProfile) public profiles;
    mapping(address => bool) public hasProfile;
    
    // 当前活跃任期
    mapping(address => uint256) public activeTermId;
    
    // 计数器
    uint256 public nextTokenId = 1;
    uint256 public nextTermId = 1;
    
    // 平台参数
    uint256 public maxTermDuration = 365 days;      // 最大任期期限
    uint256 public minTermDuration = 30 days;       // 最小任期期限
    uint256 public maxActiveTermsPerInstructor = 3; // 每个教员最大活跃任期数
    
    // ============ 事件定义 ============
    
    event StartNFTIssued(
        uint256 indexed tokenId,
        uint256 indexed termId,
        address indexed instructor,
        InstructorLevel level,
        uint256 termStart,
        uint256 termEnd
    );
    
    event EndNFTIssued(
        uint256 indexed tokenId,
        uint256 indexed startTokenId,
        address indexed instructor,
        uint256 completedAt,
        uint256 rating
    );
    
    event TermStarted(
        uint256 indexed termId,
        address indexed instructor,
        uint256 startNFTId,
        uint256 startTime
    );
    
    event TermEnded(
        uint256 indexed termId,
        address indexed instructor,
        uint256 endNFTId,
        uint256 endTime,
        InstructorStatus status
    );
    
    event InstructorProfileCreated(
        address indexed instructor,
        string name,
        uint256 timestamp
    );
    
    event InstructorProfileUpdated(address indexed instructor, uint256 timestamp);
    
    event CourseCompleted(
        uint256 indexed termId,
        address indexed instructor,
        uint256 studentCount,
        uint256 timestamp
    );
    
    event RatingSubmitted(
        uint256 indexed termId,
        address indexed student,
        uint256 rating,
        uint256 timestamp
    );
    
    // ============ 构造函数 ============
    
    constructor() ERC721("GenLoop Instructor", "GLINST") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INSTRUCTOR_ADMIN, msg.sender);
        _grantRole(INSTRUCTOR_MANAGER, msg.sender);
        _grantRole(CERTIFICATION_ISSUER, msg.sender);
    }
    
    // ============ 修饰器 ============
    
    modifier termExists(uint256 termId) {
        require(terms[termId].termId != 0, "InstructorNFT: term does not exist");
        _;
    }
    
    modifier onlyInstructor(uint256 termId) {
        require(terms[termId].instructor == msg.sender, "InstructorNFT: not term instructor");
        _;
    }
    
    // ============ 核心功能 ============
    
    /**
     * @notice 创建教员档案
     */
    function createProfile(
        address instructor,
        string calldata name,
        string calldata bio,
        string calldata expertise
    ) external onlyRole(INSTRUCTOR_MANAGER) returns (bool) {
        require(instructor != address(0), "InstructorNFT: invalid address");
        require(!hasProfile[instructor], "InstructorNFT: profile already exists");
        require(bytes(name).length > 0, "InstructorNFT: name required");
        
        profiles[instructor] = InstructorProfile({
            instructor: instructor,
            name: name,
            bio: bio,
            expertise: expertise,
            totalTerms: 0,
            totalStudents: 0,
            totalCourses: 0,
            averageRating: 0,
            isVerified: false,
            createdAt: block.timestamp
        });
        
        hasProfile[instructor] = true;
        
        emit InstructorProfileCreated(instructor, name, block.timestamp);
        return true;
    }
    
    /**
     * @notice 颁发开始NFT（任命教员）
     * @param instructor 教员地址
     * @param level 教员等级
     * @param termDuration 任期时长（秒）
     * @param courseCategory 课程类别
     * @param metadataURI 元数据URI
     */
    function issueStartNFT(
        address instructor,
        InstructorLevel level,
        uint256 termDuration,
        string calldata courseCategory,
        string calldata metadataURI
    ) external onlyRole(CERTIFICATION_ISSUER) nonReentrant whenNotPaused returns (uint256) {
        require(instructor != address(0), "InstructorNFT: invalid instructor");
        require(hasProfile[instructor], "InstructorNFT: profile not found");
        require(termDuration >= minTermDuration, "InstructorNFT: term too short");
        require(termDuration <= maxTermDuration, "InstructorNFT: term too long");
        require(
            instructorTerms[instructor].length < maxActiveTermsPerInstructor,
            "InstructorNFT: max active terms reached"
        );
        
        uint256 tokenId = nextTokenId++;
        uint256 termId = nextTermId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + termDuration;
        
        // 创建开始NFT
        startNFTs[tokenId] = StartNFT({
            tokenId: tokenId,
            instructor: instructor,
            level: level,
            appointedAt: block.timestamp,
            termStart: startTime,
            termEnd: endTime,
            courseCategory: courseCategory,
            metadataURI: metadataURI
        });
        
        tokenTypes[tokenId] = NFTType.Start;
        
        // 创建任期记录
        terms[termId] = InstructorTerm({
            termId: termId,
            instructor: instructor,
            startNFTId: tokenId,
            endNFTId: 0,
            startTime: startTime,
            endTime: 0,
            status: InstructorStatus.Active,
            level: level,
            studentCount: 0,
            courseCount: 0,
            totalRatingSum: 0,
            ratingCount: 0
        });
        
        instructorTerms[instructor].push(termId);
        startNFTToTerm[tokenId] = termId;
        activeTermId[instructor] = termId;
        
        // 更新档案
        profiles[instructor].totalTerms++;
        profiles[instructor].isVerified = true;
        
        // 铸造NFT
        _safeMint(instructor, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit StartNFTIssued(tokenId, termId, instructor, level, startTime, endTime);
        emit TermStarted(termId, instructor, tokenId, startTime);
        
        return tokenId;
    }
    
    /**
     * @notice 颁发结束NFT（完成任期）
     * @param startTokenId 对应的开始NFT ID
     * @param achievement 成就描述
     * @param metadataURI 元数据URI
     */
    function issueEndNFT(
        uint256 startTokenId,
        string calldata achievement,
        string calldata metadataURI
    ) external onlyRole(CERTIFICATION_ISSUER) nonReentrant whenNotPaused returns (uint256) {
        require(_ownerOf(startTokenId) != address(0), "InstructorNFT: start NFT not found");
        require(tokenTypes[startTokenId] == NFTType.Start, "InstructorNFT: not a start NFT");
        
        uint256 termId = startNFTToTerm[startTokenId];
        InstructorTerm storage term = terms[termId];
        
        require(term.status == InstructorStatus.Active, "InstructorNFT: term not active");
        
        uint256 tokenId = nextTokenId++;
        address instructor = startNFTs[startTokenId].instructor;
        
        // 计算平均评分
        uint256 avgRating = term.ratingCount > 0 ? term.totalRatingSum / term.ratingCount : 0;
        
        // 创建结束NFT
        endNFTs[tokenId] = EndNFT({
            tokenId: tokenId,
            startTokenId: startTokenId,
            instructor: instructor,
            completedAt: block.timestamp,
            totalStudents: term.studentCount,
            totalCourses: term.courseCount,
            rating: avgRating,
            achievement: achievement,
            metadataURI: metadataURI
        });
        
        tokenTypes[tokenId] = NFTType.End;
        
        // 更新任期记录
        term.endNFTId = tokenId;
        term.endTime = block.timestamp;
        term.status = InstructorStatus.Completed;
        
        // 更新档案
        profiles[instructor].totalStudents += term.studentCount;
        profiles[instructor].totalCourses += term.courseCount;
        _updateAverageRating(instructor);
        
        // 清除活跃任期
        if (activeTermId[instructor] == termId) {
            delete activeTermId[instructor];
        }
        
        // 铸造NFT
        _safeMint(instructor, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit EndNFTIssued(tokenId, startTokenId, instructor, block.timestamp, avgRating);
        emit TermEnded(termId, instructor, tokenId, block.timestamp, InstructorStatus.Completed);
        
        return tokenId;
    }
    
    /**
     * @notice 记录课程完成
     * @param termId 任期ID
     * @param studentCount 学生数量
     */
    function recordCourseCompletion(
        uint256 termId,
        uint256 studentCount
    ) external onlyRole(INSTRUCTOR_MANAGER) termExists(termId) {
        InstructorTerm storage term = terms[termId];
        require(term.status == InstructorStatus.Active, "InstructorNFT: term not active");
        
        term.courseCount++;
        term.studentCount += studentCount;
        
        emit CourseCompleted(termId, term.instructor, studentCount, block.timestamp);
    }
    
    /**
     * @notice 提交评分
     * @param termId 任期ID
     * @param rating 评分 (0-500, 表示0.0-5.0)
     */
    function submitRating(
        uint256 termId,
        uint256 rating
    ) external termExists(termId) {
        require(rating <= 500, "InstructorNFT: rating exceeds max");
        
        InstructorTerm storage term = terms[termId];
        require(term.status == InstructorStatus.Active, "InstructorNFT: term not active");
        
        term.totalRatingSum += rating;
        term.ratingCount++;
        
        emit RatingSubmitted(termId, msg.sender, rating, block.timestamp);
    }
    
    /**
     * @notice 提前终止任期
     */
    function terminateTerm(
        uint256 termId,
        string calldata reason
    ) external onlyRole(INSTRUCTOR_ADMIN) termExists(termId) {
        InstructorTerm storage term = terms[termId];
        require(term.status == InstructorStatus.Active, "InstructorNFT: term not active");
        
        term.status = InstructorStatus.Revoked;
        term.endTime = block.timestamp;
        
        // 清除活跃任期
        if (activeTermId[term.instructor] == termId) {
            delete activeTermId[term.instructor];
        }
        
        emit TermEnded(termId, term.instructor, 0, block.timestamp, InstructorStatus.Revoked);
    }
    
    /**
     * @notice 暂停任期
     */
    function suspendTerm(
        uint256 termId,
        string calldata reason
    ) external onlyRole(INSTRUCTOR_ADMIN) termExists(termId) {
        InstructorTerm storage term = terms[termId];
        require(term.status == InstructorStatus.Active, "InstructorNFT: term not active");
        
        term.status = InstructorStatus.Suspended;
        
        emit TermEnded(termId, term.instructor, 0, block.timestamp, InstructorStatus.Suspended);
    }
    
    /**
     * @notice 恢复任期
     */
    function resumeTerm(
        uint256 termId
    ) external onlyRole(INSTRUCTOR_ADMIN) termExists(termId) {
        InstructorTerm storage term = terms[termId];
        require(term.status == InstructorStatus.Suspended, "InstructorNFT: term not suspended");
        
        term.status = InstructorStatus.Active;
        
        emit TermStarted(termId, term.instructor, term.startNFTId, block.timestamp);
    }
    
    // ============ 查询函数 ============
    
    /**
     * @notice 获取开始NFT详情
     */
    function getStartNFT(uint256 tokenId) 
        external 
        view 
        returns (StartNFT memory) 
    {
        require(tokenTypes[tokenId] == NFTType.Start, "InstructorNFT: not a start NFT");
        return startNFTs[tokenId];
    }
    
    /**
     * @notice 获取结束NFT详情
     */
    function getEndNFT(uint256 tokenId) 
        external 
        view 
        returns (EndNFT memory) 
    {
        require(tokenTypes[tokenId] == NFTType.End, "InstructorNFT: not an end NFT");
        return endNFTs[tokenId];
    }
    
    /**
     * @notice 获取任期详情
     */
    function getTerm(uint256 termId) 
        external 
        view 
        returns (InstructorTerm memory) 
    {
        return terms[termId];
    }
    
    /**
     * @notice 获取教员档案
     */
    function getProfile(address instructor) 
        external 
        view 
        returns (InstructorProfile memory) 
    {
        require(hasProfile[instructor], "InstructorNFT: profile not found");
        return profiles[instructor];
    }
    
    /**
     * @notice 获取教员的所有任期
     */
    function getInstructorTerms(address instructor) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return instructorTerms[instructor];
    }
    
    /**
     * @notice 获取教员的活跃任期
     */
    function getActiveTerm(address instructor) 
        external 
        view 
        returns (uint256) 
    {
        return activeTermId[instructor];
    }
    
    /**
     * @notice 检查教员是否有活跃任期
     */
    function hasActiveTerm(address instructor) external view returns (bool) {
        return activeTermId[instructor] != 0;
    }
    
    /**
     * @notice 获取NFT类型
     */
    function getNFTType(uint256 tokenId) external view returns (NFTType) {
        return tokenTypes[tokenId];
    }
    
    /**
     * @notice 获取教员的完整历史
     */
    function getInstructorHistory(address instructor) 
        external 
        view 
        returns (
            uint256 totalTerms,
            uint256 completedTerms,
            uint256 activeTerms,
            uint256 totalStudents,
            uint256 totalCourses,
            uint256 avgRating
        ) 
    {
        totalTerms = instructorTerms[instructor].length;
        completedTerms = 0;
        activeTerms = 0;
        totalStudents = 0;
        totalCourses = 0;
        uint256 totalRating = 0;
        uint256 ratingCount = 0;
        
        for (uint256 i = 0; i < totalTerms; i++) {
            InstructorTerm storage term = terms[instructorTerms[instructor][i]];
            
            if (term.status == InstructorStatus.Completed) {
                completedTerms++;
                totalStudents += term.studentCount;
                totalCourses += term.courseCount;
            } else if (term.status == InstructorStatus.Active) {
                activeTerms++;
            }
            
            if (term.ratingCount > 0) {
                totalRating += term.totalRatingSum / term.ratingCount;
                ratingCount++;
            }
        }
        
        avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    }
    
    /**
     * @notice 检查任期是否过期
     */
    function isTermExpired(uint256 termId) external view termExists(termId) returns (bool) {
        InstructorTerm storage term = terms[termId];
        StartNFT storage startNFT = startNFTs[term.startNFTId];
        
        if (term.status != InstructorStatus.Active) return false;
        if (startNFT.termEnd == 0) return false; // 无限期
        
        return block.timestamp > startNFT.termEnd;
    }
    
    // ============ 内部函数 ============
    
    function _updateAverageRating(address instructor) internal {
        uint256 totalRating = 0;
        uint256 count = 0;
        
        for (uint256 i = 0; i < instructorTerms[instructor].length; i++) {
            InstructorTerm storage term = terms[instructorTerms[instructor][i]];
            if (term.ratingCount > 0) {
                totalRating += term.totalRatingSum / term.ratingCount;
                count++;
            }
        }
        
        if (count > 0) {
            profiles[instructor].averageRating = totalRating / count;
        }
    }
    
    // ============ 管理员功能 ============
    
    /**
     * @notice 更新教员档案
     */
    function updateProfile(
        address instructor,
        string calldata name,
        string calldata bio,
        string calldata expertise
    ) external onlyRole(INSTRUCTOR_MANAGER) {
        require(hasProfile[instructor], "InstructorNFT: profile not found");
        
        InstructorProfile storage profile = profiles[instructor];
        profile.name = name;
        profile.bio = bio;
        profile.expertise = expertise;
        
        emit InstructorProfileUpdated(instructor, block.timestamp);
    }
    
    /**
     * @notice 验证教员
     */
    function verifyInstructor(address instructor) external onlyRole(INSTRUCTOR_ADMIN) {
        require(hasProfile[instructor], "InstructorNFT: profile not found");
        profiles[instructor].isVerified = true;
    }
    
    /**
     * @notice 设置最大任期期限
     */
    function setMaxTermDuration(uint256 duration) external onlyRole(INSTRUCTOR_ADMIN) {
        maxTermDuration = duration;
    }
    
    /**
     * @notice 设置最小任期期限
     */
    function setMinTermDuration(uint256 duration) external onlyRole(INSTRUCTOR_ADMIN) {
        minTermDuration = duration;
    }
    
    /**
     * @notice 设置每个教员最大活跃任期数
     */
    function setMaxActiveTerms(uint256 maxTerms) external onlyRole(INSTRUCTOR_ADMIN) {
        maxActiveTermsPerInstructor = maxTerms;
    }
    
    /**
     * @notice 暂停合约
     */
    function pause() external onlyRole(INSTRUCTOR_ADMIN) {
        _pause();
    }
    
    /**
     * @notice 恢复合约
     */
    function unpause() external onlyRole(INSTRUCTOR_ADMIN) {
        _unpause();
    }
    
    // ============ 重写函数 ============
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
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