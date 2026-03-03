// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GeneToken
 * @notice 基因NFT合约
 */
contract GeneToken is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    
    mapping(uint256 => address) public geneCreators;
    
    constructor() ERC721("GenLoop Gene", "GENE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }
    
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
        
        return true;
    }
    
    function burnGene(uint256 geneId) external onlyRole(BURNER_ROLE) {
        require(_ownerOf(geneId) != address(0), "Gene not found");
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
