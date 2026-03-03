// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GenLoopTypes.sol";

/**
 * @title GeneToken
 * @notice 基因NFT合约 - GUGS (GenLoop Unified Gene Standard) 兼容
 */
contract GeneToken is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    mapping(uint256 => address) public geneCreators;
    mapping(uint256 => GenLoopTypes.GenePayload) public genePayloads;  // GUGS: 基因载荷存储
    mapping(bytes32 => uint256) public contentHashToGeneId;            // GUGS: 内容哈希到基因ID映射
    
    // GUGS 事件
    event GeneMintedWithPayload(
        uint256 indexed geneId, 
        address indexed creator, 
        GenLoopTypes.GeneFormat format,
        bytes32 contentHash
    );
    event PayloadUpdated(uint256 indexed geneId, bytes32 newContentHash);
    
    constructor() ERC721("GenLoop Gene", "GENE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
    // GUGS: 支持 payload 的铸币函数
    function mintGeneWithPayload(
        address to, 
        uint256 geneId, 
        string calldata metadataURI,
        GenLoopTypes.GenePayload calldata payload
    ) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
        returns (bool) 
    {
        require(to != address(0), "Invalid recipient");
        require(_ownerOf(geneId) == address(0), "Gene exists");
        require(bytes(payload.data).length > 0, "Empty payload");
        require(contentHashToGeneId[payload.contentHash] == 0, "Content hash exists");
        
        _safeMint(to, geneId);
        _setTokenURI(geneId, metadataURI);
        geneCreators[geneId] = to;
        genePayloads[geneId] = payload;
        contentHashToGeneId[payload.contentHash] = geneId;
        
        emit GeneMintedWithPayload(geneId, to, payload.format, payload.contentHash);
        return true;
    }
    
    // 传统铸币函数（向后兼容，使用 Native 格式）
    function mintGene(address to, uint256 geneId, string calldata metadataURI) 
        external 
        onlyRole(MINTER_ROLE) 
        nonReentrant 
        returns (bool) 
    {
        require(to != address(0), "Invalid recipient");
        require(_ownerOf(geneId) == address(0), "Gene exists");
        
        _safeMint(to, geneId);
        _setTokenURI(geneId, metadataURI);
        geneCreators[geneId] = to;
        
        // 创建默认的 Native 格式 payload
        GenLoopTypes.GenePayload memory payload = GenLoopTypes.GenePayload({
            format: GenLoopTypes.GeneFormat.Native,
            encoding: "utf-8",
            data: metadataURI,
            contentHash: keccak256(abi.encodePacked(metadataURI)),
            mimeType: "application/json"
        });
        genePayloads[geneId] = payload;
        contentHashToGeneId[payload.contentHash] = geneId;
        
        emit GeneMintedWithPayload(geneId, to, payload.format, payload.contentHash);
        return true;
    }
    
    // GUGS: 更新基因载荷
    function updatePayload(
        uint256 geneId, 
        GenLoopTypes.GenePayload calldata newPayload
    ) external onlyRole(MINTER_ROLE) {
        require(_ownerOf(geneId) != address(0), "Gene not found");
        require(bytes(newPayload.data).length > 0, "Empty payload");
        
        // 如果内容哈希变化，更新映射
        if (genePayloads[geneId].contentHash != newPayload.contentHash) {
            delete contentHashToGeneId[genePayloads[geneId].contentHash];
            require(contentHashToGeneId[newPayload.contentHash] == 0, "Content hash exists");
            contentHashToGeneId[newPayload.contentHash] = geneId;
        }
        
        genePayloads[geneId] = newPayload;
        emit PayloadUpdated(geneId, newPayload.contentHash);
    }
    
    // GUGS: 获取基因载荷
    function getGenePayload(uint256 geneId) external view returns (GenLoopTypes.GenePayload memory) {
        require(_ownerOf(geneId) != address(0), "Gene not found");
        return genePayloads[geneId];
    }
    
    // GUGS: 通过内容哈希查找基因
    function getGeneByContentHash(bytes32 contentHash) external view returns (uint256) {
        return contentHashToGeneId[contentHash];
    }
    
    // GUGS: 检查内容哈希是否存在
    function contentHashExists(bytes32 contentHash) external view returns (bool) {
        return contentHashToGeneId[contentHash] != 0;
    }
    
    function burnGene(uint256 geneId) external onlyRole(BURNER_ROLE) {
        require(_ownerOf(geneId) != address(0), "Gene not found");
        
        // GUGS: 清理 payload 相关数据
        bytes32 contentHash = genePayloads[geneId].contentHash;
        delete contentHashToGeneId[contentHash];
        delete genePayloads[geneId];
        
        _burn(geneId);
        delete geneCreators[geneId];
    }
    
    function geneExists(uint256 geneId) external view returns (bool) {
        return _ownerOf(geneId) != address(0);
    }
    
    function getGenesByOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory geneIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            geneIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return geneIds;
    }
    
    // Overrides
    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable) returns (address)
    {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
