# GenLoop 3.0 Docker 部署指南

## 快速开始

### 1. 安装 Docker 和 Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh

# 验证安装
docker --version
docker-compose --version
```

### 2. 克隆代码

```bash
git clone https://github.com/ericzhang0099/soulland.git
cd soulland/docker
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的配置
vim .env
```

### 4. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 5. 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec api npx prisma migrate deploy

# 生成 Prisma 客户端
docker-compose exec api npx prisma generate
```

## 环境变量配置

创建 `.env` 文件：

```env
# 数据库密码
DB_PASSWORD=your_secure_password

# 区块链 RPC (使用 Alchemy 或 Infura)
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# JWT 密钥
JWT_SECRET=your_jwt_secret_key

# OpenAI API Key
OPENAI_API_KEY=sk-your_openai_key
```

## 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres

# 重启服务
docker-compose restart api

# 更新代码后重新构建
docker-compose up -d --build

# 进入容器
docker-compose exec api sh
docker-compose exec postgres psql -U genloop

# 备份数据库
docker-compose exec postgres pg_dump -U genloop genloop > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U genloop genloop < backup.sql
```

## 生产环境优化

### 1. 使用外部数据库

修改 `docker-compose.yml`，注释掉 postgres 服务，使用云数据库：

```yaml
api:
  environment:
    - DATABASE_URL=postgresql://user:pass@your-db-host:5432/genloop
```

### 2. 配置 SSL

使用 Let's Encrypt：

```bash
# 安装 certbot
docker run -it --rm \
  -v "$(pwd)/ssl:/etc/letsencrypt" \
  -v "$(pwd)/nginx.conf:/etc/nginx/nginx.conf" \
  certbot/certbot certonly --standalone -d your-domain.com
```

### 3. 配置监控

添加 Prometheus + Grafana：

```yaml
# 在 docker-compose.yml 中添加
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

## 故障排除

### 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :5432

# 停止占用进程
sudo kill -9 PID
```

### 数据库连接失败

```bash
# 检查数据库状态
docker-compose logs postgres

# 重置数据库（会丢失数据）
docker-compose down -v
docker-compose up -d
```

### 内存不足

```bash
# 查看内存使用
docker stats

# 限制容器内存
docker-compose up -d --memory="512m" api
```

## 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
docker-compose up -d --build

# 3. 运行迁移
docker-compose exec api npx prisma migrate deploy

# 4. 重启服务
docker-compose restart
```
