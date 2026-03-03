// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./GenLoopTypes.sol";
import "./GeneToken.sol";
import "./GeneRegistry.sol";
import "./PaymentHandler.sol";
import "./GeneExchange.sol";

/**
 * @title GeneMerging
 * @notice 基因交配合并
 */
contract GeneMerging is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    bytes32 public constant MERGING_ADMIN = keccak256("MERGING_ADMIN");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    GeneToken public geneToken;
    GeneRegistry public geneRegistry;
    PaymentHandler public paymentHandler;
    GeneExchange public geneExchange;
    
    uint256 public mergeFee = 0.01 ether;
    uint256 public constant MERGE_COOLDOWN = 1 minutes;
    uint256 public nextGeneId;
    uint256 public totalMerges;
    
    mapping(uint256 => GenLoopTypes.MergeResult) public mergeResults;
    mapping(bytes32 => bool) public usedSignatures;
    mapping(uint256 => uint256) public lastMergeTime;
    
    struct MergeRequest {
        uint256 parentA;
        uint256 parentB;
        address requester;
        uint256 nonce;
        uint256 timestamp;
        bytes32 newDnaHash;
        uint256 predictedRarity;
        bytes signature;
    }
    
    event GenesMerged(uint256 indexed newGeneId, uint256 parentA, uint256 parentB, address creator, bytes32 dnaHash, uint256 rarity);
    event MergeFeeUpdated(uint256 newFee);
    
    constructor(address _token, address _registry, address payable _payment, address _exchange, uint256 _startId) {
        geneToken = GeneToken(_token);
        geneRegistry = GeneRegistry(_registry);
        paymentHandler = PaymentHandler(_payment);
        geneExchange = GeneExchange(_exchange);
        nextGeneId = _startId;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }
    
    function mergeGenes(MergeRequest calldata req) external payable nonReentrant returns (uint256 newGeneId) {
        require(req.requester == msg.sender, "Wrong requester");
        require(geneToken.geneExists(req.parentA), "Parent A not found");
        require(geneToken.geneExists(req.parentB), "Parent B not found");
        require(req.parentA != req.parentB, "Same parents");
        require(_canMerge(req.parentA, msg.sender), "No right A");
        require(_canMerge(req.parentB, msg.sender), "No right B");
        require(block.timestamp >= lastMergeTime[req.parentA] + MERGE_COOLDOWN, "Cooldown A");
        require(block.timestamp >= lastMergeTime[req.parentB] + MERGE_COOLDOWN, "Cooldown B");
        require(!geneRegistry.dnaHashExists(req.newDnaHash), "DNA exists");
        require(_verifySignature(req), "Bad signature");
        
        bytes32 sigHash = keccak256(req.signature);
        require(!usedSignatures[sigHash], "Replay");
        usedSignatures[sigHash] = true;
        
        if (mergeFee > 0) {
            require(msg.value == mergeFee, "Wrong fee");
            paymentHandler.processEthPayment{value: msg.value}(address(this));
        }
        
        newGeneId = nextGeneId++;
        
        lastMergeTime[req.parentA] = block.timestamp;
        lastMergeTime[req.parentB] = block.timestamp;
        
        mergeResults[newGeneId] = GenLoopTypes.MergeResult({
            newGeneId: newGeneId,
            parentA: req.parentA,
            parentB: req.parentB,
            creator: msg.sender,
            timestamp: block.timestamp,
            newDnaHash: req.newDnaHash,
            rarityScore: req.predictedRarity,
            payload: GenLoopTypes.GenePayload({
                format: GenLoopTypes.GeneFormat.Native,
                encoding: "utf-8",
                data: "",
                contentHash: req.newDnaHash,
                mimeType: "application/json"
            })
        });
        
        totalMerges++;
        emit GenesMerged(newGeneId, req.parentA, req.parentB, msg.sender, req.newDnaHash, req.predictedRarity);
    }
    
    function _verifySignature(MergeRequest calldata req) internal view returns (bool) {
        bytes32 hash = keccak256(abi.encodePacked(
            req.parentA, req.parentB, req.requester, req.nonce, req.timestamp, req.newDnaHash, req.predictedRarity
        ));
        address signer = hash.toEthSignedMessageHash().recover(req.signature);
        return hasRole(ORACLE_ROLE, signer);
    }
    
    function _canMerge(uint256 geneId, address user) internal view returns (bool) {
        if (geneToken.ownerOf(geneId) == user) return true;
        if (geneExchange.hasMergeRight(geneId, user)) return true;
        return false;
    }
    
    function setMergeFee(uint256 _fee) external onlyRole(MERGING_ADMIN) {
        mergeFee = _fee;
        emit MergeFeeUpdated(_fee);
    }
    
    function getMergeResult(uint256 geneId) external view returns (GenLoopTypes.MergeResult memory) {
        return mergeResults[geneId];
    }
}
