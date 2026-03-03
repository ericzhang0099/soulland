// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GenLoopTypes.sol";
import "./GeneToken.sol";
import "./PaymentHandler.sol";

/**
 * @title GeneExchange
 * @notice 基因交易市场 - 支持ETH、USDC和法币支付
 */
contract GeneExchange is AccessControl, ReentrancyGuard {
    
    bytes32 public constant EXCHANGE_ADMIN = keccak256("EXCHANGE_ADMIN");
    bytes32 public constant FIAT_SETTLER_ROLE = keccak256("FIAT_SETTLER_ROLE");
    
    GeneToken public geneToken;
    PaymentHandler public paymentHandler;
    
    mapping(uint256 => GenLoopTypes.Order) public orders;
    mapping(uint256 => GenLoopTypes.ForwardingLicense) public licenses;
    mapping(uint256 => uint256) public forwardingDurations;
    mapping(uint256 => mapping(address => bool)) public mergeRights;
    
    // 法币支付订单映射
    mapping(uint256 => bytes32) public orderFiatPaymentId;
    
    uint256 public nextOrderId = 1;
    uint256 public nextLicenseId = 1;
    
    uint256 public constant ORDER_EXPIRY = 7 days;
    uint256 public constant MIN_PRICE = 0.001 ether;
    uint256 public constant MIN_PRICE_USDC = 1e6; // 1 USDC (6位精度)
    
    event OrderCreated(uint256 indexed orderId, uint256 indexed geneId, address seller, uint256 price, address paymentToken, GenLoopTypes.OrderType orderType);
    event OrderCancelled(uint256 indexed orderId);
    event GeneCollected(uint256 indexed orderId, uint256 geneId, address buyer, uint256 price);
    event GeneCollectedFiat(uint256 indexed orderId, uint256 geneId, address buyer, bytes32 paymentId, uint256 amount);
    event ForwardingLicensed(uint256 indexed licenseId, uint256 geneId, address licensee, uint256 duration);
    event MergeRightAcquired(uint256 indexed orderId, uint256 geneId, address buyer);
    event MergeRightAcquiredFiat(uint256 indexed orderId, uint256 geneId, address buyer, bytes32 paymentId);
    
    constructor(address _token, address payable _payment) {
        geneToken = GeneToken(_token);
        paymentHandler = PaymentHandler(_payment);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXCHANGE_ADMIN, msg.sender);
        _grantRole(FIAT_SETTLER_ROLE, msg.sender);
    }
    
    // ========== 创建订单 ==========
    function createCollectionOrder(uint256 geneId, uint256 price, address token) 
        external nonReentrant returns (uint256 orderId) 
    {
        require(geneToken.ownerOf(geneId) == msg.sender, "Not owner");
        require(price >= (token == address(0) ? MIN_PRICE : MIN_PRICE_USDC), "Price too low");
        
        orderId = nextOrderId++;
        orders[orderId] = GenLoopTypes.Order({
            orderId: orderId,
            geneId: geneId,
            seller: msg.sender,
            price: price,
            paymentToken: token,
            orderType: GenLoopTypes.OrderType.Collection,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + ORDER_EXPIRY,
            isActive: true
        });
        
        emit OrderCreated(orderId, geneId, msg.sender, price, token, GenLoopTypes.OrderType.Collection);
    }
    
    function createForwardingOrder(uint256 geneId, uint256 price, address token, uint256 duration) 
        external nonReentrant returns (uint256 orderId) 
    {
        require(geneToken.ownerOf(geneId) == msg.sender, "Not owner");
        require(price >= (token == address(0) ? MIN_PRICE : MIN_PRICE_USDC), "Price too low");
        require(duration >= 1 hours && duration <= 365 days, "Invalid duration");
        
        orderId = nextOrderId++;
        orders[orderId] = GenLoopTypes.Order({
            orderId: orderId,
            geneId: geneId,
            seller: msg.sender,
            price: price,
            paymentToken: token,
            orderType: GenLoopTypes.OrderType.Forwarding,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + ORDER_EXPIRY,
            isActive: true
        });
        forwardingDurations[orderId] = duration;
        
        emit OrderCreated(orderId, geneId, msg.sender, price, token, GenLoopTypes.OrderType.Forwarding);
    }
    
    function createMergeRightOrder(uint256 geneId, uint256 price, address token) 
        external nonReentrant returns (uint256 orderId) 
    {
        require(geneToken.ownerOf(geneId) == msg.sender, "Not owner");
        require(price >= (token == address(0) ? MIN_PRICE : MIN_PRICE_USDC), "Price too low");
        
        orderId = nextOrderId++;
        orders[orderId] = GenLoopTypes.Order({
            orderId: orderId,
            geneId: geneId,
            seller: msg.sender,
            price: price,
            paymentToken: token,
            orderType: GenLoopTypes.OrderType.MergeRight,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + ORDER_EXPIRY,
            isActive: true
        });
        
        emit OrderCreated(orderId, geneId, msg.sender, price, token, GenLoopTypes.OrderType.MergeRight);
    }
    
    // ========== 链上支付购买 ==========
    function collectGene(uint256 orderId) external payable nonReentrant {
        GenLoopTypes.Order storage order = orders[orderId];
        require(order.isActive, "Inactive");
        require(block.timestamp <= order.expiresAt, "Expired");
        require(order.orderType == GenLoopTypes.OrderType.Collection, "Wrong type");
        
        address seller = order.seller;
        uint256 geneId = order.geneId;
        
        if (order.paymentToken == address(0)) {
            // ETH支付
            require(msg.value == order.price, "Wrong ETH");
            paymentHandler.processEthPayment{value: msg.value}(seller);
        } else {
            // USDC支付
            require(msg.value == 0, "No ETH needed");
            paymentHandler.processTokenPayment(seller, order.price, order.paymentToken);
        }
        
        geneToken.transferFrom(seller, msg.sender, geneId);
        order.isActive = false;
        
        emit GeneCollected(orderId, geneId, msg.sender, order.price);
    }
    
    function acquireMergeRight(uint256 orderId) external payable nonReentrant {
        GenLoopTypes.Order storage order = orders[orderId];
        require(order.isActive, "Inactive");
        require(block.timestamp <= order.expiresAt, "Expired");
        require(order.orderType == GenLoopTypes.OrderType.MergeRight, "Wrong type");
        
        if (order.paymentToken == address(0)) {
            require(msg.value == order.price, "Wrong ETH");
            paymentHandler.processEthPayment{value: msg.value}(order.seller);
        } else {
            require(msg.value == 0, "No ETH needed");
            paymentHandler.processTokenPayment(order.seller, order.price, order.paymentToken);
        }
        
        mergeRights[order.geneId][msg.sender] = true;
        emit MergeRightAcquired(orderId, order.geneId, msg.sender);
    }
    
    // ========== 法币支付购买 ==========
    /**
     * @notice 法币支付购买基因（由授权的后端调用）
     * @param orderId 订单ID
     * @param buyer 买家地址
     * @param paymentId 支付宝/微信订单号哈希
     */
    function collectGeneFiat(
        uint256 orderId,
        address buyer,
        bytes32 paymentId
    ) external onlyRole(FIAT_SETTLER_ROLE) nonReentrant {
        GenLoopTypes.Order storage order = orders[orderId];
        require(order.isActive, "Inactive");
        require(block.timestamp <= order.expiresAt, "Expired");
        require(order.orderType == GenLoopTypes.OrderType.Collection, "Wrong type");
        require(paymentId != bytes32(0), "Invalid paymentId");
        require(!paymentHandler.isFiatPaymentProcessed(paymentId), "Payment already processed");
        
        address seller = order.seller;
        uint256 geneId = order.geneId;
        
        // 处理法币支付
        paymentHandler.processFiatPayment(paymentId, buyer, order.price, seller);
        
        // 转移NFT
        geneToken.transferFrom(seller, buyer, geneId);
        
        // 记录法币支付ID
        orderFiatPaymentId[orderId] = paymentId;
        order.isActive = false;
        
        emit GeneCollectedFiat(orderId, geneId, buyer, paymentId, order.price);
    }
    
    /**
     * @notice 法币支付获取融合权
     */
    function acquireMergeRightFiat(
        uint256 orderId,
        address buyer,
        bytes32 paymentId
    ) external onlyRole(FIAT_SETTLER_ROLE) nonReentrant {
        GenLoopTypes.Order storage order = orders[orderId];
        require(order.isActive, "Inactive");
        require(block.timestamp <= order.expiresAt, "Expired");
        require(order.orderType == GenLoopTypes.OrderType.MergeRight, "Wrong type");
        require(paymentId != bytes32(0), "Invalid paymentId");
        require(!paymentHandler.isFiatPaymentProcessed(paymentId), "Payment already processed");
        
        // 处理法币支付
        paymentHandler.processFiatPayment(paymentId, buyer, order.price, order.seller);
        
        // 授予融合权
        mergeRights[order.geneId][buyer] = true;
        
        // 记录法币支付ID
        orderFiatPaymentId[orderId] = paymentId;
        
        emit MergeRightAcquiredFiat(orderId, order.geneId, buyer, paymentId);
    }
    
    // ========== 查询 ==========
    function hasMergeRight(uint256 geneId, address user) external view returns (bool) {
        if (geneToken.ownerOf(geneId) == user) return true;
        return mergeRights[geneId][user];
    }
    
    function getOrderFiatPaymentId(uint256 orderId) external view returns (bytes32) {
        return orderFiatPaymentId[orderId];
    }
    
    // ========== 取消订单 ==========
    function cancelOrder(uint256 orderId) external nonReentrant {
        GenLoopTypes.Order storage order = orders[orderId];
        require(order.seller == msg.sender, "Not seller");
        require(order.isActive, "Inactive");
        order.isActive = false;
        emit OrderCancelled(orderId);
    }
}
