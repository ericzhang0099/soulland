// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PaymentHandler
 * @notice 支付处理与分账 - 支持ETH、USDC和法币支付
 */
contract PaymentHandler is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant FIAT_PAYMENT_ROLE = keccak256("FIAT_PAYMENT_ROLE");
    
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    address public usdcAddress;
    address public treasury;
    
    uint256 public totalEthRevenue;
    uint256 public totalUsdcRevenue;
    uint256 public totalFiatRevenue; // 法币收入（以USDC计价，精度6位）
    
    mapping(address => uint256) public ethBalances;
    mapping(address => uint256) public usdcBalances;
    mapping(address => uint256) public fiatBalances; // 法币余额（以USDC计价）
    
    // 法币支付记录
    struct FiatPayment {
        bytes32 paymentId;      // 支付宝/微信订单号哈希
        address payer;          // 付款人
        uint256 amount;         // 金额（以USDC计价，精度6位）
        uint256 timestamp;
        bool processed;
    }
    
    mapping(bytes32 => FiatPayment) public fiatPayments;
    bytes32[] public fiatPaymentIds;
    
    event PaymentProcessed(address indexed payer, address indexed recipient, uint256 amount, address token, uint256 fee);
    event FiatPaymentProcessed(bytes32 indexed paymentId, address indexed payer, uint256 amount, uint256 fee);
    event FiatPaymentSettled(bytes32 indexed paymentId, address indexed recipient, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount, address token);
    
    constructor(address _treasury, address _usdc) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        usdcAddress = _usdc;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, _treasury);
        _grantRole(FIAT_PAYMENT_ROLE, msg.sender);
    }
    
    // ========== ETH支付 ==========
    function processEthPayment(address recipient) external payable whenNotPaused nonReentrant {
        require(msg.value > 0, "Zero payment");
        require(recipient != address(0), "Invalid recipient");
        
        uint256 fee = (msg.value * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 share = msg.value - fee;
        
        ethBalances[treasury] += fee;
        ethBalances[recipient] += share;
        totalEthRevenue += fee;
        
        emit PaymentProcessed(msg.sender, recipient, msg.value, address(0), fee);
    }
    
    // ========== USDC支付 ==========
    function processTokenPayment(address recipient, uint256 amount, address token) 
        external whenNotPaused nonReentrant 
    {
        require(amount > 0, "Zero payment");
        require(recipient != address(0), "Invalid recipient");
        
        uint256 fee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 share = amount - fee;
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        usdcBalances[treasury] += fee;
        usdcBalances[recipient] += share;
        totalUsdcRevenue += fee;
        
        emit PaymentProcessed(msg.sender, recipient, amount, token, fee);
    }
    
    // ========== 法币支付（支付宝/微信） ==========
    /**
     * @notice 处理法币支付（由授权的后端调用）
     * @param paymentId 支付订单号哈希
     * @param payer 付款人地址
     * @param amount 金额（以USDC计价，精度6位）
     * @param recipient 收款人
     */
    function processFiatPayment(
        bytes32 paymentId,
        address payer,
        uint256 amount,
        address recipient
    ) external onlyRole(FIAT_PAYMENT_ROLE) whenNotPaused nonReentrant {
        require(paymentId != bytes32(0), "Invalid paymentId");
        require(payer != address(0), "Invalid payer");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(!fiatPayments[paymentId].processed, "Payment already processed");
        
        uint256 fee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 share = amount - fee;
        
        // 记录法币支付
        fiatPayments[paymentId] = FiatPayment({
            paymentId: paymentId,
            payer: payer,
            amount: amount,
            timestamp: block.timestamp,
            processed: true
        });
        fiatPaymentIds.push(paymentId);
        
        // 更新余额（以USDC计价）
        fiatBalances[treasury] += fee;
        fiatBalances[recipient] += share;
        totalFiatRevenue += fee;
        
        emit FiatPaymentProcessed(paymentId, payer, amount, fee);
        emit FiatPaymentSettled(paymentId, recipient, share);
    }
    
    /**
     * @notice 批量处理法币支付
     */
    function batchProcessFiatPayments(
        bytes32[] calldata paymentIds,
        address[] calldata payers,
        uint256[] calldata amounts,
        address[] calldata recipients
    ) external onlyRole(FIAT_PAYMENT_ROLE) whenNotPaused {
        require(
            paymentIds.length == payers.length && 
            payers.length == amounts.length && 
            amounts.length == recipients.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < paymentIds.length; i++) {
            // 使用 try-catch 避免单个失败影响批量
            try this.processFiatPayment(paymentIds[i], payers[i], amounts[i], recipients[i]) {
                // 成功
            } catch {
                // 失败，继续处理下一个
            }
        }
    }
    
    /**
     * @notice 检查法币支付是否已处理
     */
    function isFiatPaymentProcessed(bytes32 paymentId) external view returns (bool) {
        return fiatPayments[paymentId].processed;
    }
    
    /**
     * @notice 获取法币支付详情
     */
    function getFiatPayment(bytes32 paymentId) external view returns (FiatPayment memory) {
        return fiatPayments[paymentId];
    }
    
    // ========== 提现 ==========
    function withdrawEth() external nonReentrant {
        uint256 amount = ethBalances[msg.sender];
        require(amount > 0, "No balance");
        ethBalances[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Withdrawal(msg.sender, amount, address(0));
    }
    
    function withdrawUsdc() external nonReentrant {
        uint256 amount = usdcBalances[msg.sender];
        require(amount > 0, "No balance");
        usdcBalances[msg.sender] = 0;
        IERC20(usdcAddress).safeTransfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount, usdcAddress);
    }
    
    /**
     * @notice 提现法币收入（以USDC形式）
     */
    function withdrawFiatBalance() external nonReentrant {
        uint256 amount = fiatBalances[msg.sender];
        require(amount > 0, "No balance");
        fiatBalances[msg.sender] = 0;
        IERC20(usdcAddress).safeTransfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount, usdcAddress);
    }
    
    // ========== 查询 ==========
    function getBalances(address user) external view returns (uint256 eth, uint256 usdc, uint256 fiat) {
        return (ethBalances[user], usdcBalances[user], fiatBalances[user]);
    }
    
    function getTotalRevenue() external view returns (uint256 eth, uint256 usdc, uint256 fiat) {
        return (totalEthRevenue, totalUsdcRevenue, totalFiatRevenue);
    }
    
    // ========== 管理 ==========
    function setUsdcAddress(address _usdc) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_usdc != address(0), "Invalid address");
        usdcAddress = _usdc;
    }
    
    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }
    
    receive() external payable {}
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
