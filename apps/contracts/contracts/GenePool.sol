// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GeneToken.sol";
import "./IdentityNFT.sol";
import "./AGCToken.sol";
import "./GenLoopTypes.sol";

contract GenePool is AccessControl, ReentrancyGuard, Pausable {
    
    bytes32 public constant POOL_ADMIN = keccak256("POOL_ADMIN");
    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");
    bytes32 public constant FEE_COLLECTOR = keccak256("FEE_COLLECTOR");
    
    enum TradeStatus { Pending, Active, Completed, Cancelled, Disputed }
    enum TradeType { DirectSale, Auction, Exchange, Rental }
    
    struct GeneListing {
        uint256 listingId;
        uint256 geneId;
        address seller;
        uint256 price;
        address paymentToken;
        TradeType tradeType;
        TradeStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    struct TradeRecord {
        uint256 tradeId;
        uint256 listingId;
        uint256 geneId;
        address seller;
        address buyer;
        uint256 price;
        uint256 platformFee;
        uint256 authorReward;
        uint256 timestamp;
        TradeStatus status;
    }
    
    struct FeeConfig {
        uint256 platformFeeRate;
        uint256 authorRewardRate;
        uint256 liquidityPoolRate;
        uint256 burnRate;
    }
    
    struct UserTradeStats {
        address user;
        uint256 totalBought;
        uint256 totalSold;
        uint256 totalVolume;
        uint256 totalFeesPaid;
        uint256 totalRewardsEarned;
        uint256 tradeCount;
    }
    
    GeneToken public geneToken;
    IdentityNFT public identityNFT;
    AGCToken public agcToken;
    
    mapping(uint256 => GeneListing) public listings;
    mapping(uint256 => TradeRecord) public trades;
    mapping(uint256 => uint256) public geneToListing;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userTrades;
    
    uint256 public nextListingId = 1;
    uint256 public nextTradeId = 1;
    
    FeeConfig public feeConfig;
    uint256 public constant FEE_PRECISION = 10000;
    
    address public platformWallet;
    address public liquidityPoolWallet;
    
    mapping(address => UserTradeStats) public userStats;
    mapping(address => bool) public hasStats;
    
    mapping(address => bool) public supportedPaymentTokens;
    address[] public paymentTokenList;
    
    uint256 public totalVolume;
    uint256 public totalFeesCollected;
    uint256 public totalAuthorRewards;
    uint256 public totalListings;
    uint256 public totalTrades;
    
    event GeneListed(uint256 indexed listingId, uint256 indexed geneId, address indexed seller, uint256 price, TradeType tradeType);
    event GeneDelisted(uint256 indexed listingId, uint256 indexed geneId, address indexed seller);
    event GeneSold(uint256 indexed tradeId, uint256 indexed listingId, uint256 indexed geneId, address seller, address buyer, uint256 price, uint256 platformFee, uint256 authorReward);
    event FeeDistributed(uint256 indexed tradeId, uint256 platformAmount, uint256 authorAmount, uint256 liquidityAmount, uint256 burnAmount);
    event PaymentTokenAdded(address indexed token);
    event PaymentTokenRemoved(address indexed token);
    
    constructor(address _geneToken, address _identityNFT, address _agcToken, address _platformWallet, address _liquidityPoolWallet) {
        require(_geneToken != address(0), "GenePool: invalid gene token");
        require(_identityNFT != address(0), "GenePool: invalid identity NFT");
        require(_agcToken != address(0), "GenePool: invalid AGC token");
        require(_platformWallet != address(0), "GenePool: invalid platform wallet");
        
        geneToken = GeneToken(_geneToken);
        identityNFT = IdentityNFT(_identityNFT);
        agcToken = AGCToken(_agcToken);
        platformWallet = _platformWallet;
        liquidityPoolWallet = _liquidityPoolWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(POOL_ADMIN, msg.sender);
        _grantRole(CURATOR_ROLE, msg.sender);
        _grantRole(FEE_COLLECTOR, msg.sender);
        
        feeConfig = FeeConfig({platformFeeRate: 250, authorRewardRate: 100, liquidityPoolRate: 50, burnRate: 0});
        supportedPaymentTokens[_agcToken] = true;
        paymentTokenList.push(_agcToken);
    }
    
    modifier listingExists(uint256 listingId) {
        require(listings[listingId].listingId != 0, "GenePool: listing does not exist");
        _;
    }
    
    function listGene(uint256 geneId, uint256 price, address paymentToken, TradeType tradeType, uint256 duration) external nonReentrant whenNotPaused returns (uint256) {
        require(geneToken.ownerOf(geneId) == msg.sender, "GenePool: not gene owner");
        require(price > 0, "GenePool: price must be positive");
        require(supportedPaymentTokens[paymentToken], "GenePool: unsupported payment token");
        require(geneToListing[geneId] == 0, "GenePool: gene already listed");
        
        uint256 listingId = nextListingId++;
        uint256 expiresAt = block.timestamp + duration;
        
        listings[listingId] = GeneListing({
            listingId: listingId,
            geneId: geneId,
            seller: msg.sender,
            price: price,
            paymentToken: paymentToken,
            tradeType: tradeType,
            status: TradeStatus.Active,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        geneToListing[geneId] = listingId;
        userListings[msg.sender].push(listingId);
        totalListings++;
        
        geneToken.transferFrom(msg.sender, address(this), geneId);
        
        emit GeneListed(listingId, geneId, msg.sender, price, tradeType);
        return listingId;
    }
    
    function buyGene(uint256 listingId) external nonReentrant whenNotPaused listingExists(listingId) {
        GeneListing storage listing = listings[listingId];
        require(listing.status == TradeStatus.Active, "GenePool: listing not active");
        require(block.timestamp <= listing.expiresAt, "GenePool: listing expired");
        require(listing.seller != msg.sender, "GenePool: cannot buy own gene");
        require(listing.tradeType == TradeType.DirectSale, "GenePool: not direct sale");
        
        uint256 tradeId = nextTradeId++;
        uint256 price = listing.price;
        
        (uint256 platformFee, uint256 authorReward, uint256 liquidityAmount, uint256 burnAmount) = _calculateFees(price);
        uint256 sellerAmount = price - platformFee - authorReward - liquidityAmount - burnAmount;
        
        address geneCreator = geneToken.geneCreators(listing.geneId);
        
        IERC20 paymentToken = IERC20(listing.paymentToken);
        require(paymentToken.transferFrom(msg.sender, listing.seller, sellerAmount), "GenePool: seller transfer failed");
        require(paymentToken.transferFrom(msg.sender, platformWallet, platformFee), "GenePool: platform fee failed");
        
        if (authorReward > 0 && geneCreator != address(0)) {
            require(paymentToken.transferFrom(msg.sender, geneCreator, authorReward), "GenePool: author reward failed");
        }
        if (liquidityAmount > 0 && liquidityPoolWallet != address(0)) {
            require(paymentToken.transferFrom(msg.sender, liquidityPoolWallet, liquidityAmount), "GenePool: liquidity transfer failed");
        }
        if (burnAmount > 0) {
            require(paymentToken.transferFrom(msg.sender, address(0xdead), burnAmount), "GenePool: burn failed");
        }
        
        trades[tradeId] = TradeRecord({
            tradeId: tradeId,
            listingId: listingId,
            geneId: listing.geneId,
            seller: listing.seller,
            buyer: msg.sender,
            price: price,
            platformFee: platformFee,
            authorReward: authorReward,
            timestamp: block.timestamp,
            status: TradeStatus.Completed
        });
        
        listing.status = TradeStatus.Completed;
        delete geneToListing[listing.geneId];
        
        userTrades[listing.seller].push(tradeId);
        userTrades[msg.sender].push(tradeId);
        totalTrades++;
        totalVolume += price;
        totalFeesCollected += platformFee;
        totalAuthorRewards += authorReward;
        
        _updateUserStats(listing.seller, msg.sender, price, platformFee);
        
        geneToken.transferFrom(address(this), msg.sender, listing.geneId);
        
        emit GeneSold(tradeId, listingId, listing.geneId, listing.seller, msg.sender, price, platformFee, authorReward);
        emit FeeDistributed(tradeId, platformFee, authorReward, liquidityAmount, burnAmount);
    }
    
    function delistGene(uint256 listingId) external nonReentrant listingExists(listingId) {
        GeneListing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "GenePool: not seller");
        require(listing.status == TradeStatus.Active, "GenePool: not active");
        
        listing.status = TradeStatus.Cancelled;
        delete geneToListing[listing.geneId];
        
        geneToken.transferFrom(address(this), msg.sender, listing.geneId);
        
        emit GeneDelisted(listingId, listing.geneId, msg.sender);
    }
    
    function _calculateFees(uint256 price) internal view returns (uint256 platformFee, uint256 authorReward, uint256 liquidityAmount, uint256 burnAmount) {
        platformFee = (price * feeConfig.platformFeeRate) / FEE_PRECISION;
        authorReward = (price * feeConfig.authorRewardRate) / FEE_PRECISION;
        liquidityAmount = (price * feeConfig.liquidityPoolRate) / FEE_PRECISION;
        burnAmount = (price * feeConfig.burnRate) / FEE_PRECISION;
        return (platformFee, authorReward, liquidityAmount, burnAmount);
    }
    
    function _updateUserStats(address seller, address buyer, uint256 price, uint256 fee) internal {
        if (!hasStats[seller]) {
            userStats[seller] = UserTradeStats(seller, 0, 0, 0, 0, 0, 0);
            hasStats[seller] = true;
        }
        if (!hasStats[buyer]) {
            userStats[buyer] = UserTradeStats(buyer, 0, 0, 0, 0, 0, 0);
            hasStats[buyer] = true;
        }
        
        UserTradeStats storage sellerStats = userStats[seller];
        sellerStats.totalSold++;
        sellerStats.totalVolume += price;
        sellerStats.tradeCount++;
        
        UserTradeStats storage buyerStats = userStats[buyer];
        buyerStats.totalBought++;
        buyerStats.totalVolume += price;
        buyerStats.totalFeesPaid += fee;
        buyerStats.tradeCount++;
    }
    
    function addPaymentToken(address token) external onlyRole(POOL_ADMIN) {
        require(token != address(0), "GenePool: invalid token");
        require(!supportedPaymentTokens[token], "GenePool: token already added");
        supportedPaymentTokens[token] = true;
        paymentTokenList.push(token);
        emit PaymentTokenAdded(token);
    }
    
    function removePaymentToken(address token) external onlyRole(POOL_ADMIN) {
        require(supportedPaymentTokens[token], "GenePool: token not found");
        supportedPaymentTokens[token] = false;
        emit PaymentTokenRemoved(token);
    }
    
    function updateFeeConfig(uint256 _platformFeeRate, uint256 _authorRewardRate, uint256 _liquidityPoolRate, uint256 _burnRate) external onlyRole(POOL_ADMIN) {
        require(_platformFeeRate + _authorRewardRate + _liquidityPoolRate + _burnRate <= 1000, "GenePool: total fee too high");
        feeConfig = FeeConfig(_platformFeeRate, _authorRewardRate, _liquidityPoolRate, _burnRate);
    }
    
    function updatePlatformWallet(address newWallet) external onlyRole(POOL_ADMIN) {
        require(newWallet != address(0), "GenePool: invalid wallet");
        platformWallet = newWallet;
    }
    
    function updateLiquidityPoolWallet(address newWallet) external onlyRole(POOL_ADMIN) {
        liquidityPoolWallet = newWallet;
    }
    
    function pause() external onlyRole(POOL_ADMIN) {
        _pause();
    }
    
    function unpause() external onlyRole(POOL_ADMIN) {
        _unpause();
    }
    
    function getListing(uint256 listingId) external view returns (GeneListing memory) {
        return listings[listingId];
    }
    
    function getTrade(uint256 tradeId) external view returns (TradeRecord memory) {
        return trades[tradeId];
    }
    
    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }
    
    function getUserTrades(address user) external view returns (uint256[] memory) {
        return userTrades[user];
    }
    
    function getUserStats(address user) external view returns (UserTradeStats memory) {
        return userStats[user];
    }
}