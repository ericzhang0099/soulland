// 应用常量

// 分页
export const PAGE_SIZE = 20;

// 等级配置
export const LEVELS = {
  DAOZU: { id: 1, name: '道祖', minRank: 1, maxRank: 10000, weight: 1000 },
  DALUO: { id: 2, name: '大罗', minRank: 10001, maxRank: 30000, weight: 800 },
  TAIYI: { id: 3, name: '太乙', minRank: 30001, maxRank: 80000, weight: 600 },
  JINXIAN: { id: 4, name: '金仙', minRank: 80001, maxRank: 180000, weight: 450 },
  ZHENXIAN: { id: 5, name: '真仙', minRank: 180001, maxRank: 380000, weight: 350 },
  DACHENG: { id: 6, name: '大乘', minRank: 380001, maxRank: 680000, weight: 250 },
  HETI: { id: 7, name: '合体', minRank: 680001, maxRank: 1080000, weight: 180 },
  LIANXU: { id: 8, name: '炼虚', minRank: 1080001, maxRank: 1880000, weight: 120 },
  HUASHEN: { id: 9, name: '化神', minRank: 1880001, maxRank: Infinity, weight: 80 },
};

// 交易费用
export const TRANSACTION_FEE = {
  PLATFORM: 0.1, // 10%
  AUTHOR: 0.9,   // 90%
};

// 推荐服务费用
export const RECOMMENDATION_FEE = 0.1; // 0.1 AGC per recommendation

// 进化等级
export const EVOLUTION_LEVELS = {
  BASIC: { id: 1, name: '基础级', minImprovement: 10 },
  ADVANCED: { id: 2, name: '进阶级', minImprovement: 25 },
  EXPERT: { id: 3, name: '专家级', minImprovement: 50 },
};

// 训练路径
export const TRAINING_PATHS = {
  DATA_GENERATION: { id: 0, name: '数据生成' },
  RL_EVOLUTION: { id: 1, name: '强化学习' },
  META_LEARNING: { id: 2, name: '元学习' },
  NAS: { id: 3, name: '架构搜索' },
  CODE_EVOLUTION: { id: 4, name: '代码进化' },
};

// 缓存时间
export const CACHE_TIME = {
  IDENTITY: 60 * 1000,      // 1分钟
  BALANCE: 30 * 1000,       // 30秒
  GENES: 5 * 60 * 1000,     // 5分钟
  LEADERBOARD: 10 * 60 * 1000, // 10分钟
};

// 本地存储键
export const STORAGE_KEYS = {
  THEME: 'genloop-theme',
  LANGUAGE: 'genloop-language',
  RECENT_SEARCHES: 'genloop-recent-searches',
};

// 路由路径
export const ROUTES = {
  HOME: '/',
  MARKET: '/market',
  TRAINING: '/training',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
};

// API端点
export const API_ENDPOINTS = {
  USER: '/api/user',
  GENES: '/api/genes',
  MARKET: '/api/market',
  EVOLUTION: '/api/evolution',
  LEADERBOARD: '/api/leaderboard',
};

// 错误消息
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: '请先连接钱包',
  INSUFFICIENT_BALANCE: '余额不足',
  TRANSACTION_FAILED: '交易失败',
  NETWORK_ERROR: '网络错误，请重试',
  UNAUTHORIZED: '未授权，请重新登录',
};

// 成功消息
export const SUCCESS_MESSAGES = {
  TRANSACTION_CONFIRMED: '交易已确认',
  IDENTITY_REGISTERED: '身份注册成功',
  GENE_CREATED: '基因创建成功',
  PURCHASE_SUCCESS: '购买成功',
  EVOLUTION_CERTIFIED: '进化证明已颁发',
};
