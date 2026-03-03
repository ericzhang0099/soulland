# GenLoop 智能合约部署检查清单

## 部署前检查

### 环境准备
- [ ] Node.js >= 18.0 已安装
- [ ] 项目依赖已安装 (`npm install`)
- [ ] 合约代码已编译 (`npx hardhat compile`)
- [ ] 编译无错误或警告

### 配置检查
- [ ] `.env` 文件已创建
- [ ] `PRIVATE_KEY` 已设置（不含 0x 前缀）
- [ ] `ETHERSCAN_API_KEY` 已设置
- [ ] `SEPOLIA_RPC` 已配置（或使用默认）
- [ ] `USDC_ADDRESS` 已配置（Sepolia测试网）
- [ ] `TREASURY_ADDRESS` 已配置（默认为部署者）

### 资金检查
- [ ] 部署者地址已有 Sepolia ETH
- [ ] 余额 > 0.1 ETH（推荐）
- [ ] 可以从水龙头获取：https://sepoliafaucet.com/

### 代码检查
- [ ] 所有合约文件已审核
- [ ] 构造函数参数正确
- [ ] 权限角色定义正确
- [ ] 没有硬编码的敏感信息

## 部署中检查

### 第一步：GeneRegistry 部署
- [ ] 合约部署成功
- [ ] 交易已确认（2个区块）
- [ ] 地址已记录

### 第二步：GeneToken 部署
- [ ] 合约部署成功
- [ ] 交易已确认（2个区块）
- [ ] 地址已记录

### 第三步：PaymentHandler 部署
- [ ] 构造函数参数正确（treasury, USDC）
- [ ] 合约部署成功
- [ ] 交易已确认（2个区块）
- [ ] 地址已记录

### 第四步：GeneExchange 部署
- [ ] 构造函数参数正确（GeneToken, PaymentHandler）
- [ ] 合约部署成功
- [ ] 交易已确认（2个区块）
- [ ] 地址已记录

### 第五步：GeneMerging 部署
- [ ] 构造函数参数正确（GeneToken, GeneRegistry, PaymentHandler, GeneExchange, startId）
- [ ] 合约部署成功
- [ ] 交易已确认（2个区块）
- [ ] 地址已记录

### 权限配置检查
- [ ] GeneMerging 获得 GeneToken.MINTER_ROLE
- [ ] GeneMerging 获得 GeneRegistry.REGISTRAR_ROLE
- [ ] 权限交易已确认

## 部署后检查

### 记录检查
- [ ] `deployments/sepolia-{timestamp}.json` 已创建
- [ ] `deployments/sepolia-latest.json` 已更新
- [ ] 所有合约地址正确记录
- [ ] 交易哈希正确记录

### 验证检查
- [ ] 合约已在 Etherscan 验证
- [ ] 验证状态为 "Perfect Match"
- [ ] 源代码可读
- [ ] ABI 可导出

### 功能检查
- [ ] GeneToken.symbol() 返回 "GENE"
- [ ] GeneRegistry.totalGenes() 返回 0
- [ ] PaymentHandler.treasury() 返回正确地址
- [ ] GeneExchange.nextOrderId() 返回 1
- [ ] GeneMerging.mergeFee() 返回正确值

### 权限检查
- [ ] GeneMerging 拥有 GeneToken 的铸造权限
- [ ] GeneMerging 拥有 GeneRegistry 的注册权限
- [ ] 部署者拥有所有管理员权限

## 测试网测试

### 基础功能测试
- [ ] 可以注册新基因
- [ ] 可以铸造 Gene NFT
- [ ] 可以创建交易订单
- [ ] 可以执行基因融合

### 支付功能测试
- [ ] ETH 支付正常工作
- [ ] 平台费用正确扣除
- [ ] 资金可以提现

### 权限功能测试
- [ ] 非授权用户无法铸造
- [ ] 非授权用户无法注册基因
- [ ] 暂停功能正常工作

## 上线前最终检查

### 安全配置
- [ ] 管理员权限考虑转移到多签钱包
- [ ] 关键参数已设置正确（费率、冷却时间等）
- [ ] 紧急暂停机制已测试

### 文档更新
- [ ] 合约地址已记录
- [ ] ABI 文件已导出
- [ ] 部署文档已更新
- [ ] 前端配置已更新

### 监控设置
- [ ] 事件监听已配置
- [ ] 异常报警已设置
- [ ] 关键指标监控已启用

## 紧急回滚准备

- [ ] 所有合约有暂停功能
- [ ] 管理员私钥安全保存
- [ ] 紧急联系人列表已准备
- [ ] 回滚流程文档已编写

---

## 部署签名确认

| 角色 | 姓名 | 签名 | 日期 |
|------|------|------|------|
| 部署者 | | | |
| 审核者 | | | |
| 批准者 | | | |

## 部署记录

- **网络**: Sepolia Testnet
- **部署日期**: 
- **部署者地址**: 
- **Git Commit**: 
- **部署交易哈希**: 

## 合约地址

| 合约 | 地址 | 验证状态 |
|------|------|----------|
| GeneRegistry | | |
| GeneToken | | |
| PaymentHandler | | |
| GeneExchange | | |
| GeneMerging | | |

---

**注意**: 此检查清单应在每次部署前完整执行。不要跳过任何步骤。
