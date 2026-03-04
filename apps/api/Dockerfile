# 后端API Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动
CMD ["npm", "start"]
