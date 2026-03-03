// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GenLoopPoints.sol";

/**
 * @title AlipayPaymentHandler
 * @notice 支付宝支付处理器 - 将法币支付转换为GenLoop积分
 */
contract AlipayPaymentHandler is AccessControl, Pausable, ReentrancyGuard {
    
    bytes32 public constant PAYMENT_OPERATOR_ROLE = keccak256("PAYMENT_OPERATOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    
    // GenLoop积分合约
    GenLoopPoints public pointsToken;
    
    // 支付状态枚举
    enum PaymentStatus { 
        Pending,    // 待支付
        Paid,       // 已支付
        Completed,  // 已完成（积分已发放）
        Cancelled,  // 已取消
        Refunded    // 已退款
    }
    
    // 支付宝支付订单
    struct AlipayOrder {
        bytes32 orderId;           // 订单ID（链上生成）
        bytes32 alipayOrderNo;     // 支付宝订单号哈希
        address payer;             // 付款人地址
        uint256 amountCny;         // 支付金额（人民币，单位：分）
        uint256 pointsAmount;      // 对应积分数量
        PaymentStatus status;      // 支付状态
        uint256 createdAt;         // 创建时间
        uint256 paidAt;            // 支付时间
        uint256 completedAt;       // 完成时间
        string metadata;           // 额外元数据（JSON格式）
    }
    
    // 汇率：1元人民币 = X个GLP积分（精度18）
    uint256 public exchangeRate;
    
    // 最小/最大支付金额（人民币，单位：分）
    uint256 public minAmount = 100;      // 1元
    uint256 public maxAmount = 10000000; // 100,000元
    
    // 订单映射
    mapping(bytes32 => AlipayOrder) public orders;
    mapping(bytes32 => bytes32) public alipayNoToOrderId; // 支付宝订单号 -> 订单ID
    
    // 用户订单列表
    mapping(address => bytes32[]) public userOrders;
    
    // 统计
    uint256 public totalOrders;
    uint256 public totalPaidOrders;
    uint256 public totalCompletedOrders;
    uint256 public totalRevenueCny;
    uint256 public totalPointsIssued;
    
    // 事件
    event OrderCreated(
        bytes32 indexed orderId,
        address indexed payer,
        uint256 amountCny,
        uint256 pointsAmount
    );
    
    event OrderPaid(
        bytes32 indexed orderId,
        bytes32 indexed alipayOrderNo,
        uint256 paidAt
    );
    
    event OrderCompleted(
        bytes32 indexed orderId,
        address indexed payer,
        uint256 pointsAmount
    );
    
    event OrderCancelled(bytes32 indexed orderId);
    event OrderRefunded(bytes32 indexed orderId, uint256 refundAmount);
    event ExchangeRateUpdated(uint256 oldRate, uint256 newRate);
    
    constructor(address _pointsToken, uint256 _exchangeRate) {
        require(_pointsToken != address(0), "Invalid points token");
        require(_exchangeRate > 0, "Invalid exchange rate");
        
        pointsToken = GenLoopPoints(_pointsToken);
        exchangeRate = _exchangeRate;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAYMENT_OPERATOR_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, msg.sender);
    }
    
    // ========== 订单创建 ==========
    
    /**
     * @notice 创建支付宝支付订单
     * @param amountCny 支付金额（人民币，单位：分）
     * @param metadata 额外元数据
     * @return orderId 生成的订单ID
     */
    function createOrder(
        uint256 amountCny,
        string calldata metadata
    ) external whenNotPaused returns (bytes32 orderId) {
        require(amountCny >= minAmount, "Amount too small");
        require(amountCny <= maxAmount, "Amount too large");
        
        // 计算积分数量
        uint256 pointsAmount = (amountCny * exchangeRate) / 100; // 分转元后再计算
        
        // 生成订单ID
        orderId = keccak256(abi.encodePacked(
            msg.sender,
            amountCny,
            block.timestamp,
            totalOrders
        ));
        
        require(orders[orderId].payer == address(0), "Order already exists");
        
        // 创建订单
        orders[orderId] = AlipayOrder({
            orderId: orderId,
            alipayOrderNo: bytes32(0),
            payer: msg.sender,
            amountCny: amountCny,
            pointsAmount: pointsAmount,
            status: PaymentStatus.Pending,
            createdAt: block.timestamp,
            paidAt: 0,
            completedAt: 0,
            metadata: metadata
        });
        
        userOrders[msg.sender].push(orderId);
        totalOrders++;
        
        emit OrderCreated(orderId, msg.sender, amountCny, pointsAmount);
        
        return orderId;
    }
    
    // ========== 支付处理（由后端调用） ==========
    
    /**
     * @notice 确认支付宝支付成功
     * @param orderId 订单ID
     * @param alipayOrderNo 支付宝订单号
     */
    function confirmPayment(
        bytes32 orderId,
        string calldata alipayOrderNo
    ) external onlyRole(PAYMENT_OPERATOR_ROLE) whenNotPaused nonReentrant {
        AlipayOrder storage order = orders[orderId];
        
        require(order.payer != address(0), "Order not found");
        require(order.status == PaymentStatus.Pending, "Invalid order status");
        require(bytes(alipayOrderNo).length > 0, "Invalid alipay order no");
        
        bytes32 alipayNoHash = keccak256(abi.encodePacked(alipayOrderNo));
        require(alipayNoToOrderId[alipayNoHash] == bytes32(0), "Alipay order already used");
        
        // 更新订单状态
        order.alipayOrderNo = alipayNoHash;
        order.status = PaymentStatus.Paid;
        order.paidAt = block.timestamp;
        
        alipayNoToOrderId[alipayNoHash] = orderId;
        
        totalPaidOrders++;
        totalRevenueCny += order.amountCny;
        
        emit OrderPaid(orderId, alipayNoHash, block.timestamp);
        
        // 自动发放积分
        _completeOrder(orderId);
    }
    
    /**
     * @notice 完成订单并发放积分
     */
    function _completeOrder(bytes32 orderId) internal {
        AlipayOrder storage order = orders[orderId];
        
        require(order.status == PaymentStatus.Paid, "Order not paid");
        
        order.status = PaymentStatus.Completed;
        order.completedAt = block.timestamp;
        
        totalCompletedOrders++;
        totalPointsIssued += order.pointsAmount;
        
        // 铸造积分给支付人
        pointsToken.mint(order.payer, order.pointsAmount);
        
        emit OrderCompleted(orderId, order.payer, order.pointsAmount);
    }
    
    /**
     * @notice 批量确认支付（用于后端批量处理）
     */
    function batchConfirmPayments(
        bytes32[] calldata orderIds,
        string[] calldata alipayOrderNos
    ) external onlyRole(PAYMENT_OPERATOR_ROLE) whenNotPaused {
        require(orderIds.length == alipayOrderNos.length, "Array length mismatch");
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            try this.confirmPayment(orderIds[i], alipayOrderNos[i]) {
                // 成功
            } catch {
                // 失败，继续处理下一个
            }
        }
    }
    
    // ========== 订单管理 ==========
    
    /**
     * @notice 取消待支付订单
     */
    function cancelOrder(bytes32 orderId) external whenNotPaused {
        AlipayOrder storage order = orders[orderId];
        
        require(order.payer != address(0), "Order not found");
        require(order.payer == msg.sender || hasRole(PAYMENT_OPERATOR_ROLE, msg.sender), "Not authorized");
        require(order.status == PaymentStatus.Pending, "Can only cancel pending orders");
        
        order.status = PaymentStatus.Cancelled;
        
        emit OrderCancelled(orderId);
    }
    
    /**
     * @notice 退款已支付订单（由管理员操作）
     */
    function refundOrder(
        bytes32 orderId,
        uint256 refundPoints
    ) external onlyRole(PAYMENT_OPERATOR_ROLE) whenNotPaused nonReentrant {
        AlipayOrder storage order = orders[orderId];
        
        require(order.payer != address(0), "Order not found");
        require(order.status == PaymentStatus.Completed, "Order not completed");
        require(refundPoints <= order.pointsAmount, "Refund exceeds order value");
        
        order.status = PaymentStatus.Refunded;
        
        // 销毁积分
        pointsToken.burn(order.payer, refundPoints);
        
        emit OrderRefunded(orderId, refundPoints);
    }
    
    // ========== 查询函数 ==========
    
    /**
     * @notice 获取订单详情
     */
    function getOrder(bytes32 orderId) external view returns (AlipayOrder memory) {
        return orders[orderId];
    }
    
    /**
     * @notice 获取用户所有订单
     */
    function getUserOrders(address user) external view returns (bytes32[] memory) {
        return userOrders[user];
    }
    
    /**
     * @notice 获取用户订单数量
     */
    function getUserOrderCount(address user) external view returns (uint256) {
        return userOrders[user].length;
    }
    
    /**
     * @notice 检查支付宝订单号是否已使用
     */
    function isAlipayOrderUsed(string calldata alipayOrderNo) external view returns (bool) {
        bytes32 alipayNoHash = keccak256(abi.encodePacked(alipayOrderNo));
        return alipayNoToOrderId[alipayNoHash] != bytes32(0);
    }
    
    /**
     * @notice 计算可获得的积分数量
     */
    function calculatePoints(uint256 amountCny) external view returns (uint256) {
        return (amountCny * exchangeRate) / 100;
    }
    
    // ========== 管理函数 ==========
    
    /**
     * @notice 更新汇率
     */
    function setExchangeRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate > 0, "Invalid rate");
        uint256 oldRate = exchangeRate;
        exchangeRate = newRate;
        emit ExchangeRateUpdated(oldRate, newRate);
    }
    
    /**
     * @notice 设置支付金额限制
     */
    function setAmountLimits(uint256 _min, uint256 _max) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_min < _max, "Invalid limits");
        minAmount = _min;
        maxAmount = _max;
    }
    
    /**
     * @notice 更新积分合约地址
     */
    function setPointsToken(address _pointsToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_pointsToken != address(0), "Invalid address");
        pointsToken = GenLoopPoints(_pointsToken);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
