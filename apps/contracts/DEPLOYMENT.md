# GenLoop 2.0 智能合约部署指南

## 概述

GenLoop 2.0 智能合约支持：
- **ETH 支付** - 原生以太坊支付
- **USDC 支付** - ERC20 稳定币支付
- **法币支付** - 支付宝/微信支付（链下处理，链上结算）

## 合约列表

1. **GeneRegistry** - 基因注册与管理
2. **GeneToken** - 基因NFT合约 (ERC721)
3. **PaymentHandler** - 支付处理（支持ETH、USDC、法币）
4. **GeneExchange** - 基因交易市场（支持法币支付）
5. **GeneMerging** - 基因融合

## 快速开始

### 1. 环境配置

```bash
cd /root/workspaces/feishu-feishu-ou_57f7f1ea9abd3a8b81a557f8676015b9~/genloop-mvp/apps/contracts

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写以下信息：
# PRIVATE_KEY=your_private_key_here_without_0x_prefix
# ETHERSCAN_API_KEY=your_etherscan_api_key
# TREASURY_ADDRESS=your_treasury_address (可选，默认为部署者)
```

### 2. 安装依赖

```bash
npm install
```

### 3. 编译合约

```bash
npx hardhat compile
```

### 4. 部署到 Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

部署脚本会自动：
1. 按正确顺序部署所有合约
2. 配置合约权限关系
3. 保存部署记录到 `deployments/` 目录
4. 自动生成 `config/contract-addresses.ts` 配置文件
5. 自动验证合约（需要 ETHERSCAN_API_KEY）

### 5. 验证部署

```bash
npx hardhat run scripts/check-deployment.ts --network sepolia
```

### 6. 手动验证（如需要）

```bash
npx hardhat run scripts/verify.ts --network sepolia
```

## 合约地址配置

部署成功后，合约地址会自动保存到 `config/contract-addresses.ts`：

```typescript
export const CONTRACT_ADDRESSES = {
  sepolia: {
    chainId: 11155111,
    GeneRegistry: "0x...",
    GeneToken: "0x...",
    PaymentHandler: "0x...",
    GeneExchange: "0x...",
    GeneMerging: "0x...",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  },
};
```

## 法币支付流程

### 架构设计

```
用户 -> 支付宝/微信支付 -> 后端服务 -> 调用合约 -> 链上结算
```

### 支付流程

1. **用户下单** - 用户在前端选择法币支付
2. **生成订单** - 后端生成支付宝/微信订单，返回支付二维码
3. **用户支付** - 用户完成支付宝/微信支付
4. **支付回调** - 支付宝/微信通知后端支付成功
5. **链上结算** - 后端调用 `GeneExchange.collectGeneFiat()` 完成NFT转移

### 后端权限配置

后端服务需要有 `FIAT_PAYMENT_ROLE` 权限：

```javascript
// 授予后端服务法币支付权限
const FIAT_PAYMENT_ROLE = await paymentHandler.FIAT_PAYMENT_ROLE();
await paymentHandler.grantRole(FIAT_PAYMENT_ROLE, backendWalletAddress);
```

### 合约调用示例

```javascript
// 后端调用法币支付购买
const tx = await geneExchange.collectGeneFiat(
  orderId,           // 订单ID
  buyerAddress,      // 买家地址
  paymentId          // 支付宝订单号哈希
);
await tx.wait();
```

## 常用命令

```bash
# 编译合约
npx hardhat compile

# 本地测试部署
npx hardhat run scripts/deploy.ts --network hardhat

# Sepolia 部署
npx hardhat run scripts/deploy.ts --network sepolia

# 验证合约
npx hardhat run scripts/verify.ts --network sepolia

# 检查部署状态
npx hardhat run scripts/check-deployment.ts --network sepolia

# 运行测试
npx hardhat test
```

## 手动验证命令

```bash
# GeneToken (无参数)
npx hardhat verify --network sepolia GENE_TOKEN_ADDRESS

# PaymentHandler
npx hardhat verify --network sepolia PAYMENT_HANDLER_ADDRESS "TREASURY_ADDRESS" "USDC_ADDRESS"

# GeneExchange
npx hardhat verify --network sepolia GENE_EXCHANGE_ADDRESS "GENE_TOKEN_ADDRESS" "PAYMENT_HANDLER_ADDRESS"

# GeneMerging
npx hardhat verify --network sepolia GENE_MERGING_ADDRESS "GENE_TOKEN_ADDRESS" "GENE_REGISTRY_ADDRESS" "PAYMENT_HANDLER_ADDRESS" "GENE_EXCHANGE_ADDRESS" 1
```

## 获取测试网 ETH

- https://sepoliafaucet.com/ (Alchemy)
- https://www.infura.io/faucet/sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia

## Sepolia USDC

合约地址: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

获取测试 USDC:
1. 访问 https://faucet.circle.com/
2. 选择 Sepolia 网络
3. 输入你的钱包地址

## 安全注意事项

1. **私钥安全** - 永远不要将私钥提交到代码仓库
2. **权限管理** - 生产环境部署后，将管理员权限转移到多签钱包
3. **后端安全** - 确保后端服务的 `FIAT_PAYMENT_ROLE` 私钥安全
4. **支付验证** - 后端必须严格验证支付宝/微信支付的回调签名

## 故障排除

### 部署失败 - 余额不足
```
Error: insufficient funds for intrinsic transaction cost
```
**解决**: 从水龙头获取更多 Sepolia ETH

### 验证失败 - 合约未找到
```
Error: Contract source code not verified
```
**解决**: 等待几分钟后重试，或手动验证

### 权限配置失败
```
Error: execution reverted
```
**解决**: 检查部署者是否有管理员权限

## 联系支持

- Hardhat 文档: https://hardhat.org/docs
- Etherscan API: https://etherscan.io/apis
- OpenZeppelin: https://docs.openzeppelin.com/
