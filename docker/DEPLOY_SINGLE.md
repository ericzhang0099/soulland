# GenLoop 3.0 单服务器部署指南 (Sophia 测试网)

## 服务器要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 1核 | 2核 |
| 内存 | 2GB | 4GB |
| 磁盘 | 20GB SSD | 50GB SSD |
| 带宽 | 1Mbps | 3Mbps |
| 月费用 | ¥50-100 | ¥100-200 |

**推荐**: 阿里云/腾讯云 2核4G 轻量应用服务器

---

## 快速部署 (一键脚本)

```bash
# 1. 登录服务器
ssh root@your-server-ip

# 2. 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/ericzhang0099/soulland/main/scripts/deploy-single.sh | bash

# 或使用 wget
wget -qO- https://raw.githubusercontent.com/ericzhang0099/soulland/main/scripts/deploy-single.sh | bash
```

脚本会自动完成：
- ✅ 系统更新
- ✅ 安装 Node.js 18、Docker、Nginx、PM2
- ✅ 配置防火墙
- ✅ 克隆代码
- ✅ 启动 PostgreSQL + Redis
- ✅ 部署后端 API

---

## 手动部署 (Docker Compose)

```bash
# 1. 克隆代码
git clone https://github.com/ericzhang0099/soulland.git
cd soulland/docker

# 2. 配置环境
cp .env.example .env
vim .env  # 编辑配置

# 3. 启动服务
docker-compose -f docker-compose.single.yml up -d

# 4. 初始化数据库
docker-compose exec api npx prisma migrate deploy
```

---

## 环境变量配置

```env
# 基础配置
NODE_ENV=production
PORT=3000

# 数据库 (Docker 内部网络)
DATABASE_URL=postgresql://genloop:password@postgres:5432/genloop
REDIS_URL=redis://redis:6379

# ==========================================
# Sophia 测试网配置
# ==========================================
SOPHIA_RPC_URL=https://testnet.sophia.network/rpc
SOPHIA_CHAIN_ID=97
SOPHIA_NETWORK_NAME="Sophia Testnet"

# 测试网合约地址 (部署后更新)
GENE_NFT_CONTRACT=0x...
GENE_MARKET_CONTRACT=0x...
EVOLUTION_CONTRACT=0x...

# 测试钱包私钥 (仅用于测试网!)
PRIVATE_KEY=0x...

# API 密钥
JWT_SECRET=your_random_secret
OPENAI_API_KEY=sk-...
```

---

## 常用命令

```bash
# 查看状态
docker-compose ps
pm2 status

# 查看日志
docker-compose logs -f api
pm2 logs genloop-api

# 重启服务
docker-compose restart api
pm2 restart genloop-api

# 更新代码
cd /opt/genloop && git pull
docker-compose up -d --build

# 备份数据库
docker exec genloop-postgres pg_dump -U genloop genloop > backup.sql
```

---

## 区块链配置说明

### 为什么不需要自建节点？

| 对比 | 主网 | Sophia 测试网 |
|------|------|---------------|
| 数据量 | 几个 TB | 几个 GB |
| 同步时间 | 几天 | 几分钟 |
| 存储需求 | 大 | 小 |
| 公共 RPC | 有限制 | 免费可用 |

### 使用公共 RPC

```javascript
// 配置示例
const provider = new ethers.JsonRpcProvider(
  'https://testnet.sophia.network/rpc'
);
```

### 获取测试币

1. 访问 Sophia 测试网水龙头
2. 输入你的测试网钱包地址
3. 领取测试币用于开发和测试

---

## 故障排除

### 端口被占用
```bash
sudo lsof -i :3000
sudo kill -9 PID
```

### 数据库连接失败
```bash
docker-compose logs postgres
docker-compose restart postgres
```

### 内存不足
```bash
# 添加 Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 成本估算

| 项目 | 月费用 |
|------|--------|
| 阿里云 2核4G | ¥100-150 |
| 腾讯云 2核4G | ¥80-120 |
| 域名 (可选) | ¥30-50 |
| SSL 证书 (Let's Encrypt) | 免费 |
| **总计** | **¥100-200/月** |

---

## 下一步

1. ✅ 部署完成
2. 🔧 配置域名和 SSL
3. 📝 部署智能合约到测试网
4. 🔑 更新合约地址到 .env
5. 🚀 开始测试！

需要帮助？查看完整文档或联系支持。
