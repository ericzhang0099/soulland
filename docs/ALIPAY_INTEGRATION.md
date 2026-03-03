# GenLoop 支付宝支付集成文档

## 概述

本文档描述如何在 GenLoop 2.0 中集成支付宝支付功能，使用户能够使用人民币购买 GenLoop 积分 (GLP)。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户 (Web/App)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GenLoop Web Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  充值页面     │  │ 支付回调页面  │  │   充值记录页面        │   │
│  │  /payment    │  │/payment/callback│  │ /payment/history    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌─────────────────────────────┐
│  GenLoop API    │ │ 支付宝    │ │      区块链网络              │
│  (Node.js)      │ │ 开放平台  │ │                             │
│                 │ │           │ │  ┌──────────────────────┐   │
│ • 支付通知处理   │◄┤           │ │  │AlipayPaymentHandler │   │
│ • 订单管理      │ │           │ │  │  - 订单创建           │   │
│ • 签名验证      │ │           │ │  │  - 支付确认           │   │
└─────────────────┘ └──────────┘ │  │  - 积分发放           │   │
                                 │  └──────────────────────┘   │
                                 │  ┌──────────────────────┐   │
                                 │  │   GenLoopPoints      │   │
                                 │  │    (ERC20 Token)     │   │
                                 │  └──────────────────────┘   │
                                 └─────────────────────────────┘
```

## 文件结构

### 智能合约 (`apps/contracts/`)

```
contracts/
├── AlipayPaymentHandler.sol    # 支付宝支付处理器
├── GenLoopPoints.sol           # GLP积分代币
└── ...                         # 其他现有合约

scripts/
└── deploy-alipay.ts            # 部署脚本
```

### Web前端 (`apps/web/`)

```
app/
├── payment/
│   ├── page.tsx                # 充值页面
│   ├── callback/
│   │   └── page.tsx            # 支付回调页面
│   └── history/
│       └── page.tsx            # 充值记录页面
└── page.tsx                    # 首页（已添加充值入口）

lib/contracts/
└── config.ts                   # 合约配置和ABI
```

### API服务 (`apps/api/`)

```
src/
├── config/
│   └── alipay.config.ts        # 支付宝配置
├── services/
│   └── alipay.service.ts       # 支付宝服务
├── routes/
│   └── payment.routes.ts       # 支付路由
└── app.ts                      # 应用入口
```

## 快速开始

### 1. 部署智能合约

```bash
cd apps/contracts

# 编译合约
npx hardhat compile

# 部署到测试网
npx hardhat run scripts/deploy-alipay.ts --network sepolia

# 部署到主网
npx hardhat run scripts/deploy-alipay.ts --network mainnet
```

### 2. 配置环境变量

#### Web前端 (`apps/web/.env.local`)

```env
NEXT_PUBLIC_ALIPAY_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_POINTS_TOKEN_ADDRESS=0x...
```

#### API服务 (`apps/api/.env`)

```env
# 支付宝配置
ALIPAY_APP_ID=your_app_id
ALIPAY_APP_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=alipay_public_key
ALIPAY_SANDBOX=true

# 合约配置
ALIPAY_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://sepolia.infura.io/v3/...
```

### 3. 启动服务

```bash
# 启动API服务
cd apps/api
npm install
npm run dev

# 启动Web前端
cd apps/web
npm run dev
```

## 支付流程

### 1. 用户创建订单

1. 用户访问 `/payment` 页面
2. 选择充值金额（10/50/100/500元或自定义）
3. 点击"创建订单"，调用智能合约 `createOrder()`
4. 合约生成订单ID并记录到链上

### 2. 用户支付

1. 后端根据订单信息生成支付宝支付URL
2. 用户被重定向到支付宝支付页面
3. 用户完成支付

### 3. 支付回调处理

1. 支付宝异步通知后端 `/api/payment/alipay/notify`
2. 后端验证签名
3. 后端调用智能合约 `confirmPayment()` 确认支付
4. 合约自动发放 GLP 积分给用户

### 4. 支付结果展示

1. 用户被重定向到 `/payment/callback`
2. 页面显示支付结果
3. 用户可以在 `/payment/history` 查看充值记录

## 智能合约接口

### AlipayPaymentHandler

#### 写函数

```solidity
// 创建订单
function createOrder(uint256 amountCny, string calldata metadata) 
    external returns (bytes32 orderId)

// 确认支付（仅OPERATOR）
function confirmPayment(bytes32 orderId, string calldata alipayOrderNo) 
    external

// 取消订单
function cancelOrder(bytes32 orderId) external

// 退款（仅OPERATOR）
function refundOrder(bytes32 orderId, uint256 refundPoints) external
```

#### 读函数

```solidity
// 获取订单详情
function getOrder(bytes32 orderId) external view returns (AlipayOrder memory)

// 获取用户订单列表
function getUserOrders(address user) external view returns (bytes32[] memory)

// 计算积分数量
function calculatePoints(uint256 amountCny) external view returns (uint256)

// 检查支付宝订单是否已使用
function isAlipayOrderUsed(string calldata alipayOrderNo) external view returns (bool)
```

## API接口

### 创建支付

```http
POST /api/payment/alipay/create
Content-Type: application/json

{
  "orderId": "0x...",
  "amount": 100,
  "subject": "GenLoop积分充值",
  "deviceType": "pc"
}
```

### 支付宝异步通知

```http
POST /api/payment/alipay/notify
Content-Type: application/x-www-form-urlencoded

# 支付宝标准回调参数
```

### 验证支付状态

```http
GET /api/payment/verify?orderId=xxx
```

## 安全注意事项

1. **私钥保护**: 支付宝私钥必须妥善保管，不可泄露到前端
2. **签名验证**: 所有支付宝回调必须验证签名
3. **幂等性**: 同一支付宝订单号不能重复处理
4. **权限控制**: 只有授权的后端地址可以调用 `confirmPayment`
5. **HTTPS**: 生产环境必须使用HTTPS

## 测试

### 沙箱环境

1. 登录 [支付宝开放平台](https://open.alipay.com)
2. 进入"开发中心" → "沙箱"
3. 获取沙箱APPID、密钥
4. 下载支付宝沙箱版APP
5. 使用沙箱账号进行测试

### 测试账号

```
买家账号: sbzlzd9948@sandbox.com
登录密码: 111111
支付密码: 111111
```

## 故障排查

### 常见问题

1. **签名验证失败**
   - 检查密钥格式是否正确
   - 确认使用的是支付宝公钥而非应用公钥

2. **订单未找到**
   - 确认订单ID格式正确
   - 检查链上交易是否已确认

3. **积分未到账**
   - 检查合约是否有足够的铸造权限
   - 查看交易回执确认是否成功

## 更新日志

### v1.0.0 (2024-03-03)
- 初始版本
- 支持支付宝电脑网站支付和手机网站支付
- 支持 GLP 积分自动发放
