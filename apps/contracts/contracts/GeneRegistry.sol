// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./GenLoopTypes.sol";

/**
 * @title GeneRegistry
 * @notice 基因注册与管理
 */
contract GeneRegistry is AccessControl, Pausable {
    
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    
    mapping(uint256 => GenLoopTypes.Gene) public genes;
    mapping(bytes32 => bool) public dnaHashExists;
    mapping(address => uint256[]) public userGeneIds;
    
    uint256[] public allGeneIds;
    uint256 public totalGenes;
    uint256 public nextGeneId = 1;
    
    uint256 public constant MAX_RARITY = 10000;
    uint256 public minRarityForMerging = 1000;
    
    event GeneRegistered(uint256 indexed geneId, address indexed creator, GenLoopTypes.GeneType geneType, uint256 rarityScore, bytes32 dnaHash);
    event GeneActivated(uint256 indexed geneId);
    event GeneDeactivated(uint256 indexed geneId);
    event RarityUpdated(uint256 indexed geneId, uint256 newRarity);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }
    
    function registerGene(
        address creator,
        GenLoopTypes.GeneType geneType,
        uint256 rarityScore,
        bytes32 dnaHash
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused returns (uint256 geneId) {
        require(creator != address(0), "Invalid creator");
        require(rarityScore <= MAX_RARITY, "Rarity too high");
        require(!dnaHashExists[dnaHash], "DNA exists");
        
        geneId = nextGeneId++;
        
        genes[geneId] = GenLoopTypes.Gene({
            id: geneId,
            creator: creator,
            geneType: geneType,
            rarityScore: rarityScore,
            dnaHash: dnaHash,
            createdAt: block.timestamp,
            parentA: 0,
            parentB: 0,
            generation: 1,
            isActive: true
        });
        
        dnaHashExists[dnaHash] = true;
        userGeneIds[creator].push(geneId);
        allGeneIds.push(geneId);
        totalGenes++;
        
        emit GeneRegistered(geneId, creator, geneType, rarityScore, dnaHash);
        return geneId;
    }
    
    function registerMergedGene(
        address creator,
        uint256 parentA,
        uint256 parentB,
        uint256 rarityScore,
        bytes32 dnaHash
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused returns (uint256 geneId) {
        require(genes[parentA].id != 0, "Parent A not found");
        require(genes[parentB].id != 0, "Parent B not found");
        require(rarityScore <= MAX_RARITY, "Rarity too high");
        require(!dnaHashExists[dnaHash], "DNA exists");
        
        uint256 generation = (genes[parentA].generation > genes[parentB].generation 
            ? genes[parentA].generation : genes[parentB].generation) + 1;
        
        geneId = nextGeneId++;
        
        genes[geneId] = GenLoopTypes.Gene({
            id: geneId,
            creator: creator,
            geneType: GenLoopTypes.GeneType.Hybrid,
            rarityScore: rarityScore,
            dnaHash: dnaHash,
            createdAt: block.timestamp,
            parentA: parentA,
            parentB: parentB,
            generation: generation,
            isActive: true
        });
        
        dnaHashExists[dnaHash] = true;
        userGeneIds[creator].push(geneId);
        allGeneIds.push(geneId);
        totalGenes++;
        
        emit GeneRegistered(geneId, creator, GenLoopTypes.GeneType.Hybrid, rarityScore, dnaHash);
        return geneId;
    }
    
    function updateRarity(uint256 geneId, uint256 newRarity) external onlyRole(VALIDATOR_ROLE) {
        require(genes[geneId].id != 0, "Gene not found");
        require(newRarity <= MAX_RARITY, "Rarity too high");
        genes[geneId].rarityScore = newRarity;
        emit RarityUpdated(geneId, newRarity);
    }
    
    function setGeneActive(uint256 geneId, bool active) external onlyRole(REGISTRAR_ROLE) {
        require(genes[geneId].id != 0, "Gene not found");
        genes[geneId].isActive = active;
        if (active) emit GeneActivated(geneId);
        else emit GeneDeactivated(geneId);
    }
    
    function getGene(uint256 geneId) external view returns (GenLoopTypes.Gene memory) {
        return genes[geneId];
    }
    
    function getUserGenes(address user) external view returns (uint256[] memory) {
        return userGeneIds[user];
    }
    
    function canMerge(uint256 geneId) external view returns (bool) {
        GenLoopTypes.Gene storage gene = genes[geneId];
        if (gene.id == 0) return false;
        if (!gene.isActive) return false;
        if (gene.rarityScore < minRarityForMerging) return false;
        return true;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
