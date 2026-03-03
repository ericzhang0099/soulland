# 使用Node.js 20 LTS版本
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY src ./src

# 构建TypeScript
RUN npm run build

# 生产环境
FROM node:20-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache redis curl

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从builder阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置文件权限
RUN chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 启动命令
CMD ["node", "dist/index.js"]