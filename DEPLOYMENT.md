# GenLoop 3.0 部署指南

## 环境要求

- Node.js 20+
- Python 3.10+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/your-org/genloop-mvp.git
cd genloop-mvp
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的配置
```

### 3. 启动本地开发环境

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL 数据库
- Redis 缓存
- 后端 API (http://localhost:3001)
- 前端 (http://localhost:3000)
- 训练模块

### 4. 部署智能合约

```bash
cd apps/contracts
npm install
npx hardhat run deploy/00_deploy_core.js --network sepolia
```

### 5. 运行测试

```bash
# 合约测试
cd apps/contracts && npx hardhat test

# API测试
cd apps/api && npm test

# 前端测试
cd apps/web && npm test
```

## 生产环境部署

### 1. 构建镜像

```bash
docker-compose -f docker-compose.prod.yml build
```

### 2. 部署到服务器

```bash
./scripts/deploy.sh
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| SEPOLIA_RPC_URL | Sepolia网络RPC | https://sepolia.infura.io/v3/... |
| PRIVATE_KEY | 部署钱包私钥 | 0x... |
| DATABASE_URL | PostgreSQL连接字符串 | postgresql://user:pass@host:5432/db |
| JWT_SECRET | JWT签名密钥 | your-secret-key |

## 监控

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## 故障排除

### 合约部署失败
- 检查钱包余额
- 确认网络配置正确

### 数据库连接失败
- 检查PostgreSQL是否运行
- 确认DATABASE_URL格式正确

## 支持

如有问题，请联系开发团队。
