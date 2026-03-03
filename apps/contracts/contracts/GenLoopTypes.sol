// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title GenLoopTypes
 * @notice 共享数据类型定义
 */
library GenLoopTypes {
    
    enum GeneType {
        Ability,        // 能力型基因
        Strategy,       // 策略型基因
        Knowledge,      // 知识型基因
        Hybrid          // 混合型基因
    }
    
    // GUGS: GenLoop Unified Gene Standard
    enum GeneFormat {
        Native,         // 原生 GenLoop 格式
        GEP,            // EvoMap GEP 格式 (JSON)
        SkillMD,        // ClawHub SKILL.md 格式
        Custom          // 自定义格式
    }

    struct GenePayload {
        GeneFormat format;         // 格式类型
        string encoding;           // 编码方式 (utf-8, base64, etc.)
        string data;               // 原始数据内容
        bytes32 contentHash;       // 内容哈希 (验证完整性)
        string mimeType;           // MIME 类型
    }

    struct Gene {
        uint256 id;
        address creator;
        GeneType geneType;
        uint256 rarityScore;       // 0-10000
        bytes32 dnaHash;
        uint256 createdAt;
        uint256 parentA;
        uint256 parentB;
        uint256 generation;
        bool isActive;
        GenePayload payload;       // GUGS: 多格式基因载荷
    }
    
    struct Order {
        uint256 orderId;
        uint256 geneId;
        address seller;
        uint256 price;
        address paymentToken;
        OrderType orderType;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
    }
    
    enum OrderType {
        Collection,
        Forwarding,
        MergeRight
    }
    
    struct ForwardingLicense {
        uint256 licenseId;
        uint256 geneId;
        address licensor;
        address licensee;
        uint256 startTime;
        uint256 endTime;
        uint256 price;
        bool isActive;
    }
    
    struct MergeResult {
        uint256 newGeneId;
        uint256 parentA;
        uint256 parentB;
        address creator;
        uint256 timestamp;
        bytes32 newDnaHash;
        uint256 rarityScore;
        GenePayload payload;       // GUGS: 合并结果的载荷
    }
}
