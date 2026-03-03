# GenLoop 算力网关集成说明

## 新增模块

已添加 `apps/compute-gateway` 算力网关服务，与现有GenLoop系统集成。

## 系统架构

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GenLoop Web   │────▶│  Compute Gateway │────▶│  AI Providers   │
│   (Frontend)    │     │   (Port 3002)    │     │ (OpenAI/Claude) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Smart Contract │     │  Redis Cache     │
│  GenLoopPoints  │     │  (Quota/Usage)   │
└─────────────────┘     └──────────────────┘
```

## 集成点

### 1. AGC积分扣除

算力网关通过调用 `GenLoopPoints` 合约的 `burnFrom` 方法扣除用户积分：

```typescript
// 网关持有BURNER_ROLE，可直接销毁用户积分
pointsToken.burnFrom(userAddress, amount);
```

需要给网关地址授权 `BURNER_ROLE`：

```solidity
// 在部署后执行
pointsToken.grantRole(BURNER_ROLE, gatewayAddress);
```

### 2. 前端集成示例

```typescript
// 调用算力网关API
const response = await fetch('http://localhost:3002/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Address': userAddress, // 用户钱包地址
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
});
```

### 3. 环境变量配置

在 `apps/compute-gateway/.env` 中配置：

```bash
# 区块链连接
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POINTS_CONTRACT_ADDRESS=0x... // GenLoopPoints合约地址
GATEWAY_PRIVATE_KEY=0x...     // 网关钱包私钥(需有BURNER_ROLE)

# 上游API密钥
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
QWEN_API_KEY=sk-...
```

## 定价策略

| 供应商 | 模型 | 输入价格(AGC/1K) | 输出价格(AGC/1K) |
|--------|------|------------------|------------------|
| OpenAI | gpt-4 | 30 | 60 |
| OpenAI | gpt-3.5-turbo | 0.5 | 1.5 |
| Anthropic | claude-3-opus | 15 | 75 |
| 通义千问 | qwen-turbo | 0.2 | 0.6 |
| 智谱 | glm-4 | 1 | 1 |
| DeepSeek | deepseek-chat | 0.1 | 0.2 |

## 启动服务

```bash
# 1. 安装依赖
cd apps/compute-gateway
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env

# 3. 启动服务
npm run dev

# 或使用Docker
docker-compose up -d
```

## API端点

- `POST /v1/chat/completions` - 聊天完成
- `GET /v1/models` - 列出可用模型
- `GET /v1/users/me/stats` - 用户用量统计
- `POST /v1/cost/estimate` - 成本估算
- `GET /health` - 健康检查
- `GET /admin/providers` - 供应商状态

## 配额限制

默认用户配额：
- 60 RPM (每分钟请求数)
- 100,000 TPM (每分钟Token数)
- 10,000 RPD (每日请求数)
- 单次请求最大消耗 100 AGC
