#!/bin/bash
# GenLoop 3.0 单服务器部署脚本 (Sophia 测试网)
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-production}
PROJECT_NAME="genloop"

echo -e "${BLUE}GenLoop 3.0 单服务器部署 (Sophia Testnet)${NC}"

# 检查 root
if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}请使用 sudo 运行${NC}"
    exit 1
fi

# 系统更新
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt-get update && apt-get upgrade -y

# 安装依赖
echo -e "${YELLOW}[2/8] 安装依赖...${NC}"
apt-get install -y curl wget git nginx certbot python3-certbot-nginx docker.io docker-compose ufw
systemctl enable docker && systemctl start docker

# 防火墙
echo -e "${YELLOW}[3/8] 配置防火墙...${NC}"
ufw allow ssh && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 3000/tcp
echo "y" | ufw enable

# Node.js
echo -e "${YELLOW}[4/8] 安装 Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# 代码
echo -e "${YELLOW}[5/8] 部署代码...${NC}"
mkdir -p /opt/${PROJECT_NAME} && cd /opt/${PROJECT_NAME}
if [ -d ".git" ]; then git pull; else git clone https://github.com/ericzhang0099/soulland.git .; fi

# 环境变量
echo -e "${YELLOW}[6/8] 配置环境...${NC}"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
JWT_SECRET=$(openssl rand -base64 64)

cat > .env << EOF
NODE_ENV=${ENV}
PORT=3000
DATABASE_URL=postgresql://genloop:${DB_PASSWORD}@localhost:5432/genloop
REDIS_URL=redis://localhost:6379

# Sophia 测试网
SOPHIA_RPC_URL=https://testnet.sophia.network/rpc
SOPHIA_CHAIN_ID=97
SOPHIA_NETWORK_NAME="Sophia Testnet"

JWT_SECRET=${JWT_SECRET}
OPENAI_API_KEY=
LOG_LEVEL=info
EOF

echo -e "${YELLOW}请编辑 /opt/${PROJECT_NAME}/.env 填入 OPENAI_API_KEY${NC}"

# 数据库
echo -e "${YELLOW}[7/8] 启动数据库...${NC}"
cat > docker-compose.db.yml <>EOF
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: genloop
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: genloop
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: always
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    restart: always
volumes:
  postgres_data:
  redis_data:
EOF

docker-compose -f docker-compose.db.yml up -d
sleep 10

# API
echo -e "${YELLOW}[8/8] 部署 API...${NC}"
cd /opt/${PROJECT_NAME}/apps/api
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm build

# PM2 启动
pm2 delete genloop-api 2>/dev/null || true
pm2 start dist/index.js --name genloop-api
pm2 save && pm2 startup

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo "API: http://$(curl -s ip.sb):3000"
echo "编辑 .env: vim /opt/${PROJECT_NAME}/.env"
echo "查看日志: pm2 logs"
