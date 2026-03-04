# GenLoop 2.0 技术架构文档

## 系统概述

GenLoop 2.0 是一个基于区块链的 AI 基因资产交易平台，实现了基因 NFT 的创建、交易、融合和算力消耗闭环。

---

## 一、系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              GenLoop 2.0 生态系统                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Web 前端   │    │   API 服务   │    │  算力网关    │              │
│  │  (Next.js)   │◄──►│  (Node.js)   │◄──►│  (Port 3002) │              │
│  │   Port 3000  │    │   Port 3001  │    │              │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                       │
│         └───────────────────┼───────────────────┘                       │
│                             │                                           │
│                             ▼                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    区块链层 (Sepolia 测试网)                   │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │      │
│  │  │GeneToken │ │GeneRegis-│ │GeneExch- │ │Payment   │        │      │
│  │  │  (NFT)   │ │  try     │ │  ange    │ │ Handler  │        │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │      │
│  │  │GeneMerg- │ │GenLoop   │ │Alipay    │                      │      │
│  │  │   ing    │ │  Points  │ │ Payment  │                      │      │
│  │  └──────────┘ └──────────┘ └──────────┘                      │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块说明

| 模块 | 技术栈 | 功能 |
|------|--------|------|
| **Web 前端** | Next.js + RainbowKit | 用户界面、钱包连接、基因展示 |
| **API 服务** | Node.js + Express | 支付宝支付、订单管理、业务逻辑 |
| **算力网关** | Node.js + Redis | AI 算力路由、AGC 积分消耗 |
| **智能合约** | Solidity + OpenZeppelin | 基因 NFT、交易、融合、支付 |

---

## 二、智能合约架构

### 2.1 合约清单

| 合约名称 | 功能 | 部署地址 |
|----------|------|----------|
| **GeneToken** | ERC-721 基因 NFT | 0x6e8e47d3c846Ddf0677D8864504707c33fDfd790 |
| **GeneRegistry** | 基因注册与管理 | 0x69eE5b18C7d698B065b12B9bCC033Cda7F1BFe44 |
| **GeneExchange** | 基因交易市场 | 0x2CB9Ab014e4D4032CAEbf34bB6778164BE7ACF20 |
| **GeneMerging** | 基因融合系统 | 0x56a8205E10812f4aae2A8e8d034630eEcd29feba |
| **PaymentHandler** | 支付处理中心 | 0xD4f0ac032E35deB8C9830166Cf5EDDB5352B5436 |
| **GenLoopPoints** | AGC 积分代币 | (动态部署) |

### 2.2 核心数据结构

#### Gene (基因)
```solidity
struct Gene {
    uint256 id;              // 基因唯一ID
    address creator;         // 创建者地址
    GeneType geneType;       // 基因类型
    uint256 rarityScore;     // 稀有度评分 0-10000
    bytes32 dnaHash;         // DNA哈希
    uint256 createdAt;       // 创建时间
    uint256 parentA;         // 父代A
    uint256 parentB;         // 父代B
    uint256 generation;      // 世代
    bool isActive;           // 是否激活
    GenePayload payload;     // GUGS: 多格式载荷
}
```

#### GenePayload (基因载荷 - GUGS标准)
```solidity
struct GenePayload {
    GeneFormat format;       // 格式类型
    string encoding;         // 编码方式
    string data;             // 原始数据
    bytes32 contentHash;     // 内容哈希
    string mimeType;         // MIME类型
}
```

#### Order (订单)
```solidity
struct Order {
    uint256 orderId;         // 订单ID
    uint256 geneId;          // 基因ID
    address seller;          // 卖家
    uint256 price;           // 价格
    address paymentToken;    // 支付代币
    OrderType orderType;     // 订单类型
    uint256 createdAt;       // 创建时间
    uint256 expiresAt;       // 过期时间
    bool isActive;           // 是否有效
}
```

### 2.3 合约交互关系

```
┌─────────────────────────────────────────────────────────┐
│                      用户操作                            │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  GeneToken   │   │ GeneRegistry │   │ GeneExchange │
│   创建NFT    │   │   注册管理   │   │   交易基因   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌──────────────┐       ┌──────────────┐
       │ GeneMerging  │       │PaymentHandler│
       │   融合基因   │       │   处理支付   │
       └──────────────┘       └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │GenLoopPoints │
                              │  AGC积分代币 │
                              └──────────────┘
```

---

## 三、前端架构

### 3.1 技术栈

- **框架**: Next.js 14 (App Router)
- **UI库**: Tailwind CSS + shadcn/ui
- **Web3**: RainbowKit + wagmi + viem
- **图表**: Recharts
- **状态**: React Hooks

### 3.2 页面结构

```
app/
├── page.tsx                 # 首页 - 基因展示
├── layout.tsx               # 根布局
├── providers.tsx            # Web3 提供者
├── gene/
│   └── [id]/
│       └── page.tsx         # 基因详情页
├── payment/
│   └── page.tsx             # 支付页面
├── merge/
│   └── page.tsx             # 基因融合页
└── admin/
    └── page.tsx             # 管理后台

components/
├── gene/
│   ├── GeneCard.tsx         # 基因卡片
│   ├── GeneList.tsx         # 基因列表
│   └── GeneDetail.tsx       # 基因详情
├── payment/
│   └── PaymentForm.tsx      # 支付表单
├── wallet/
│   └── ConnectButton.tsx    # 连接钱包
└── ui/                      # shadcn 组件

lib/
├── contracts/               # 合约配置
│   ├── config.ts           # 合约地址和ABI
│   └── interactions.ts     # 合约交互函数
├── utils/
│   └── format.ts           # 格式化工具
└── gugs/                   # GUGS 兼容层
    ├── GEPParser.ts
    ├── SkillMdParser.ts
    └── UnifiedGene.ts
```

### 3.3 核心功能

| 功能 | 说明 |
|------|------|
| **基因展示** | 展示基因 NFT 的元数据、稀有度、属性 |
| **钱包连接** | 支持 MetaMask、WalletConnect 等 |
| **支付集成** | 支付宝支付 + 区块链支付双通道 |
| **基因融合** | 选择两个基因进行融合操作 |
| **GUGS兼容** | 支持 EvoMap/ClawHub 格式导入 |

---

## 四、API 服务架构

### 4.1 功能模块

```
api/
├── src/
│   ├── routes/
│   │   ├── payment.js      # 支付路由
│   │   ├── order.js        # 订单路由
│   │   └── alipay.js       # 支付宝路由
│   ├── services/
│   │   ├── alipayService.js # 支付宝服务
│   │   └── orderService.js  # 订单服务
│   └── models/
│       └── Order.js        # 订单模型
```

### 4.2 支付流程

```
用户选择基因
    │
    ▼
创建订单 (API)
    │
    ▼
选择支付方式
    │
    ├──────► 支付宝支付 ──► 支付宝SDK ──► 支付回调 ──► 确认上链
    │
    └──────► 区块链支付 ──► 合约调用 ──► 直接转账
```

### 4.3 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/payment/create` | POST | 创建支付订单 |
| `/api/payment/verify` | POST | 验证支付结果 |
| `/api/alipay/notify` | POST | 支付宝回调 |
| `/api/order/create` | POST | 创建订单 |
| `/api/order/status` | GET | 查询订单状态 |

---

## 五、算力网关架构

### 5.1 系统架构

```
用户请求
    │
    ▼
┌─────────────────┐
│  Compute Gateway │
│   (Port 3002)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│  Redis │ │区块链  │
│  缓存  │ │扣费    │
└────┬───┘ └────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│           AI 供应商路由                  │
│  ┌────────┐┌────────┐┌────────┐        │
│  │ OpenAI ││ Claude ││  千问  │        │
│  └────────┘└────────┘└────────┘        │
└─────────────────────────────────────────┘
```

### 5.2 核心功能

| 功能 | 说明 |
|------|------|
| **多供应商路由** | 支持 OpenAI、Claude、通义千问等 |
| **AGC 积分扣费** | 调用合约 burnFrom 方法 |
| **配额管理** | RPM/TPM/RPD 限制 |
| **成本估算** | 预先计算调用成本 |

### 5.3 定价策略

| 供应商 | 模型 | 输入价格 | 输出价格 |
|--------|------|----------|----------|
| OpenAI | gpt-4 | 30 AGC/1K | 60 AGC/1K |
| OpenAI | gpt-3.5-turbo | 0.5 AGC/1K | 1.5 AGC/1K |
| Anthropic | claude-3-opus | 15 AGC/1K | 75 AGC/1K |
| 通义千问 | qwen-turbo | 0.2 AGC/1K | 0.6 AGC/1K |

---

## 六、GUGS 兼容层

### 6.1 设计目标

实现 GenLoop 与 EvoMap、ClawHub 等平台的基因互操作。

### 6.2 格式支持

| 格式 | 来源 | 标识 |
|------|------|------|
| Native | GenLoop | 0 |
| GEP | EvoMap | 1 |
| SkillMD | ClawHub | 2 |
| Custom | 自定义 | 3 |

### 6.3 核心组件

```typescript
// UnifiedGene.ts - 统一基因接口
interface UnifiedGene {
  id: string;
  creator: string;
  geneType: number;
  rarityScore: number;
  payload: GenePayload;
  metadata?: Record<string, any>;
}

// GEPParser.ts - EvoMap 格式解析
function parseGEP(data: string): ParseResult<GEPGene>

// SkillMdParser.ts - ClawHub 格式解析
function parseSkillMD(data: string): ParseResult<SkillMDGene>

// ImportTool.ts - 导入工具
function autoImport(data: string): Promise<ImportResult>
```

---

## 七、部署信息

### 7.1 合约部署地址 (Sepolia 测试网)

| 合约 | 地址 |
|------|------|
| GeneToken | 0x6e8e47d3c846Ddf0677D8864504707c33fDfd790 |
| GeneRegistry | 0x69eE5b18C7d698B065b12B9bCC033Cda7F1BFe44 |
| GeneExchange | 0x2CB9Ab014e4D4032CAEbf34bB6778164BE7ACF20 |
| GeneMerging | 0x56a8205E10812f4aae2A8e8d034630eEcd29feba |
| PaymentHandler | 0xD4f0ac032E35deB8C9830166Cf5EDDB5352B5436 |

### 7.2 服务端口

| 服务 | 端口 |
|------|------|
| Web 前端 | 3000 |
| API 服务 | 3001 |
| 算力网关 | 3002 |

---

## 八、代码统计

| 类型 | 数量 |
|------|------|
| Solidity 合约 | 188 个文件 |
| 前端 TS/TSX | 1,831 个文件 |
| 后端 TS | 113 个文件 |
| **总计** | **36,632 个文件** |

---

## 九、核心创新点

1. **基因 NFT 化**: 将 AI 能力封装为可交易的 NFT 资产
2. **融合机制**: 支持基因的组合进化，产生新的能力
3. **双轨支付**: 支持法币（支付宝）和加密货币双通道
4. **算力闭环**: AGC 积分系统连接基因交易和 AI 算力消耗
5. **GUGS 标准**: 实现跨平台的基因互操作

---

## 十、GitHub 仓库

**地址**: https://github.com/Ericzhang0099/Soulland

**主要提交**:
- `6f22cbdd1` - GenLoop 2.0 完整代码
- `7da19daaa` - GUGS 兼容层实现
- `6a22ea839` - Sentinel Ultimate 架构报告

---

**文档版本**: v1.0  
**创建时间**: 2026年3月4日  
**作者**: GenLoop Team
