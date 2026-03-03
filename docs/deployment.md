# GenLoop 部署文档

**版本**: 0.1.0  
**网络**: Sepolia测试网

---

## 1. 环境准备

### 1.1 必要工具
```bash
# Node.js v18+
npm install -g hardhat

# 安装依赖
cd apps/contracts
npm install
```

### 1.2 环境变量
```bash
# .env文件
PRIVATE_KEY=your_private_key
SEPOLIA_RPC=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_key
```

---

## 2. 合约部署

### 2.1 编译合约
```bash
npx hardhat compile
```

### 2.2 部署到Sepolia
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2.3 验证合约
```bash
# 验证GeneToken
npx hardhat verify --network sepolia DEPLOYED_ADDRESS

# 验证其他合约...
```

---

## 3. 部署后配置

### 3.1 授权角色
```bash
# 已包含在deploy.ts中，如需手动执行:
npx hardhat run scripts/grant-roles.ts --network sepolia
```

### 3.2 更新前端配置
编辑 `apps/web/lib/contracts/config.ts`:
```typescript
export const CONTRACTS = {
  sepolia: {
    geneToken: "0x...",
    geneRegistry: "0x...",
    geneExchange: "0x...",
    geneMerging: "0x...",
    paymentHandler: "0x...",
  },
};
```

---

## 4. 前端部署

### 4.1 构建
```bash
cd apps/web
npm install
npm run build
```

### 4.2 部署到Vercel
```bash
# 使用Vercel CLI
vercel --prod
```

---

## 5. 部署检查清单

- [ ] 合约编译成功
- [ ] 合约部署成功
- [ ] 合约验证成功
- [ ] 角色授权完成
- [ ] 前端配置更新
- [ ] 前端构建成功
- [ ] 前端部署成功
- [ ] 端到端测试通过

---

## 6. 紧急回滚

### 6.1 合约暂停
```bash
npx hardhat run scripts/pause.ts --network sepolia
```

### 6.2 前端回滚
在Vercel控制台选择上一个版本部署。

---

**部署负责人**: PM-02  
**最后更新**: 2026-02-25 00:06
