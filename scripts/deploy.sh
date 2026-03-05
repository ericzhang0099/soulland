#!/bin/bash
# GenLoop 3.0 一键部署脚本
# 使用方法: ./deploy.sh [环境]
# 示例: ./deploy.sh production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
ENV=${1:-staging}
PROJECT_NAME="genloop"
DOMAIN="${ENV}.genloop.app"

# 检查 root 权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}请使用 root 权限运行此脚本${NC}"
        exit 1
    fi
}

# 安装基础依赖
install_base() {
    echo -e "${YELLOW}正在安装基础依赖...${NC}"
    
    apt-get update
    apt-get install -y \
        curl \
        wget \
        git \
        nginx \
        certbot \
        python3-certbot-nginx \
        docker.io \
        docker-compose \
        postgresql-client \
        redis-tools \
        htop \
        vim \
        ufw
    
    # 启动 Docker
    systemctl enable docker
    systemctl start docker
    
    echo -e "${GREEN}基础依赖安装完成${NC}"
}

# 配置防火墙
setup_firewall() {
    echo -e "${YELLOW}配置防火墙...${NC}"
    
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp  # API
    ufw allow 3001/tcp  # WebSocket
    
    echo "y" | ufw enable
    
    echo -e "${GREEN}防火墙配置完成${NC}"
}

# 安装 Node.js
install_nodejs() {
    echo -e "${YELLOW}安装 Node.js 18...${NC}"
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # 安装 pnpm
    npm install -g pnpm
    
    echo -e "${GREEN}Node.js 安装完成: $(node -v)${NC}"
}

# 克隆代码
deploy_code() {
    echo -e "${YELLOW}部署代码...${NC}"
    
    mkdir -p /opt/${PROJECT_NAME}
    cd /opt/${PROJECT_NAME}
    
    if [ -d ".git" ]; then
        git pull origin main
    else
        git clone https://github.com/ericzhang0099/soulland.git .
    fi
    
    echo -e "${GREEN}代码部署完成${NC}"
}

# 配置环境变量
setup_env() {
    echo -e "${YELLOW}配置环境变量...${NC}"
    
    cat > /opt/${PROJECT_NAME}/.env << EOF
# 数据库
DATABASE_URL=postgresql://genloop:your_password@localhost:5432/genloop

# Redis
REDIS_URL=redis://localhost:6379

# 区块链 (使用 Alchemy 免费 RPC)
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# API 密钥
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_jwt_secret

# 环境
NODE_ENV=${ENV}
PORT=3000
EOF
    
    echo -e "${GREEN}环境变量配置完成${NC}"
    echo -e "${YELLOW}请编辑 /opt/${PROJECT_NAME}/.env 文件，填入实际的 API 密钥${NC}"
}

# 启动数据库
deploy_database() {
    echo -e "${YELLOW}启动数据库...${NC}"
    
    cd /opt/${PROJECT_NAME}
    
    # 使用 Docker Compose 启动数据库
    cat > docker-compose.db.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: genloop-postgres
    environment:
      POSTGRES_USER: genloop
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: genloop
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: always
    
  redis:
    image: redis:7-alpine
    container_name: genloop-redis
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
    
    echo -e "${GREEN}数据库启动完成${NC}"
}

# 部署后端 API
deploy_api() {
    echo -e "${YELLOW}部署后端 API...${NC}"
    
    cd /opt/${PROJECT_NAME}/apps/api
    
    # 安装依赖
    pnpm install
    
    # 生成 Prisma 客户端
    npx prisma generate
    
    # 运行数据库迁移
    npx prisma migrate deploy
    
    # 构建
    pnpm build
    
    # 使用 PM2 启动
    pnpm install -g pm2
    pm2 start dist/index.js --name genloop-api
    pm2 save
    pm2 startup
    
    echo -e "${GREEN}后端 API 部署完成${NC}"
}

# 部署前端
deploy_web() {
    echo -e "${YELLOW}部署前端...${NC}"
    
    cd /opt/${PROJECT_NAME}/apps/web
    
    # 安装依赖
    pnpm install
    
    # 构建
    pnpm build
    
    # 复制到 Nginx 目录
    rm -rf /var/www/genloop
    cp -r dist /var/www/genloop
    
    echo -e "${GREEN}前端部署完成${NC}"
}

# 配置 Nginx
setup_nginx() {
    echo -e "${YELLOW}配置 Nginx...${NC}"
    
    cat > /etc/nginx/sites-available/genloop << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    # 前端静态文件
    location / {
        root /var/www/genloop;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket 代理
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF
    
    # 启用站点
    ln -sf /etc/nginx/sites-available/genloop /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl restart nginx
    
    echo -e "${GREEN}Nginx 配置完成${NC}"
}

# 配置 SSL
setup_ssl() {
    echo -e "${YELLOW}配置 SSL 证书...${NC}"
    
    # 使用 Certbot 获取证书
    certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    # 设置自动续期
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    echo -e "${GREEN}SSL 证书配置完成${NC}"
}

# 配置监控
setup_monitoring() {
    echo -e "${YELLOW}配置监控...${NC}"
    
    # 安装 Node Exporter (Prometheus)
    docker run -d \
        --name node-exporter \
        -p 9100:9100 \
        --restart always \
        prom/node-exporter
    
    echo -e "${GREEN}监控配置完成${NC}"
}

# 显示完成信息
show_completion() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  GenLoop 3.0 部署完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "访问地址: https://${DOMAIN}"
    echo -e "API 地址: https://${DOMAIN}/api"
    echo ""
    echo -e "${YELLOW}重要提醒:${NC}"
    echo "1. 请编辑 /opt/${PROJECT_NAME}/.env 文件，填入实际的 API 密钥"
    echo "2. 重启 API 服务: pm2 restart genloop-api"
    echo "3. 查看日志: pm2 logs genloop-api"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo "- 查看状态: pm2 status"
    echo "- 查看日志: pm2 logs"
    echo "- 重启服务: pm2 restart all"
    echo "- 更新代码: cd /opt/${PROJECT_NAME} && git pull && ./deploy.sh ${ENV}"
    echo ""
}

# 主函数
main() {
    echo -e "${GREEN}开始部署 GenLoop 3.0 (${ENV} 环境)...${NC}"
    
    check_root
    install_base
    setup_firewall
    install_nodejs
    deploy_code
    setup_env
    deploy_database
    deploy_api
    deploy_web
    setup_nginx
    setup_ssl
    setup_monitoring
    show_completion
}

# 执行主函数
main
