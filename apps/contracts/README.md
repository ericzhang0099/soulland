# GenLoop 合约部署快速参考

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写 PRIVATE_KEY 和 ETHERSCAN_API_KEY

# 3. 编译合约
npm run compile

# 4. 部署到 Sepolia
npm run deploy:sepolia

# 5. 检查部署状态
npm run check:sepolia

# 6. 验证合约（如自动验证失败）
npm run verify:sepolia
```

## 项目结构

```
contracts/
├── GenLoopPoints.sol      # ERC20积分代币
├── GeneRegistry.sol       # 基因注册
├── GeneToken.sol          # 基因NFT (ERC721)
├── GeneExchange.sol       # 基因交易
├── GeneMerging.sol        # 基因融合
├── PaymentHandler.sol     # 支付处理
└── GenLoopTypes.sol       # 共享类型定义

scripts/
├── deploy.ts              # 主部署脚本
├── verify.ts              # 合约验证脚本
└── check-deployment.ts    # 部署状态检查

deployments/
├── sepolia-latest.json    # 最新部署记录
└── sepolia-{timestamp}.json  # 历史部署记录
```

## 部署顺序

```
1. GeneRegistry (独立)
2. GeneToken (独立)
3. PaymentHandler (依赖: treasury, USDC)
4. GeneExchange (依赖: GeneToken, PaymentHandler)
5. GeneMerging (依赖: GeneToken, GeneRegistry, PaymentHandler, GeneExchange)
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run compile` | 编译合约 |
| `npm run deploy:local` | 本地部署 |
| `npm run deploy:sepolia` | Sepolia 部署 |
| `npm run verify:sepolia` | 验证合约 |
| `npm run check:sepolia` | 检查部署状态 |
| `npm run clean` | 清理编译缓存 |
| `npm run coverage` | 运行测试覆盖率 |

## 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `PRIVATE_KEY` | ✅ | 部署者私钥（不含0x） |
| `ETHERSCAN_API_KEY` | ✅ | Etherscan API Key |
| `SEPOLIA_RPC` | ❌ | Sepolia RPC URL |
| `USDC_ADDRESS` | ❌ | Sepolia USDC 地址 |
| `TREASURY_ADDRESS` | ❌ | 金库地址 |

## 验证命令示例

```bash
# GeneToken (无参数)
npx hardhat verify --network sepolia <ADDRESS>

# PaymentHandler
npx hardhat verify --network sepolia <ADDRESS> "<TREASURY>" "<USDC>"

# GeneExchange
npx hardhat verify --network sepolia <ADDRESS> "<GENE_TOKEN>" "<PAYMENT_HANDLER>"

# GeneMerging
npx hardhat verify --network sepolia <ADDRESS> "<GENE_TOKEN>" "<GENE_REGISTRY>" "<PAYMENT_HANDLER>" "<GENE_EXCHANGE>" 1
```

## 获取测试网 ETH

- https://sepoliafaucet.com/ (Alchemy)
- https://www.infura.io/faucet/sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia

## 文档

- [完整部署指南](./DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
