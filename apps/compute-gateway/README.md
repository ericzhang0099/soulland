# GenLoop Compute Gateway

GenLoop 算力网关服务 - 提供多供应商AI模型的统一接入和AGC积分兑换算力功能。

## 功能特性

- **多供应商支持**: OpenAI, Anthropic, 通义千问, 智谱GLM, DeepSeek, GPU推理
- **智能路由**: 负载均衡、故障转移、熔断降级
- **AGC积分支付**: 与GenLoop积分系统深度集成
- **配额管理**: RPM/TPM限制、日用量控制
- **流式响应**: 支持SSE流式输出

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入API密钥和合约地址
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
npm start
```

## API文档

### 聊天完成

```bash
POST /v1/chat/completions
Content-Type: application/json
X-User-Address: 0x...

{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "stream": false
}
```

### 列出模型

```bash
GET /v1/models
```

### 用户统计

```bash
GET /v1/users/me/stats
X-User-Address: 0x...
```

### 成本估算

```bash
POST /v1/cost/estimate
{
  "model": "gpt-4",
  "messages": [...]
}
```

## 定价

| 模型 | 输入价格 | 输出价格 |
|------|----------|----------|
| gpt-4 | 30 AGC/1K tokens | 60 AGC/1K tokens |
| gpt-3.5-turbo | 0.5 AGC/1K tokens | 1.5 AGC/1K tokens |
| claude-3-opus | 15 AGC/1K tokens | 75 AGC/1K tokens |
| qwen-turbo | 0.2 AGC/1K tokens | 0.6 AGC/1K tokens |
| deepseek-chat | 0.1 AGC/1K tokens | 0.2 AGC/1K tokens |

## 架构

```
compute-gateway/
├── src/
│   ├── adapters/      # 供应商适配器
│   ├── core/          # 核心路由、熔断、负载均衡
│   ├── services/      # 业务服务
│   ├── routes/        # API路由
│   └── types/         # 类型定义
```

## 与主系统集成

算力网关作为独立服务运行，通过以下方式与GenLoop主系统集成：

1. **AGC积分**: 调用GenLoopPoints合约进行积分扣除
2. **用户认证**: 通过X-User-Address header传递用户地址
3. **API网关**: 可通过Nginx或Kong统一代理
