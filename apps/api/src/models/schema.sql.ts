/**
 * 数据库表结构定义
 * 
 * 执行以下SQL创建表：
 */

export const CREATE_TABLES_SQL = `
-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY COMMENT '订单ID',
  user_address VARCHAR(42) NOT NULL COMMENT '用户钱包地址',
  amount_cny DECIMAL(10, 2) NOT NULL COMMENT '支付金额（人民币）',
  points_amount DECIMAL(20, 8) NOT NULL COMMENT '积分数量',
  status ENUM('pending', 'paid', 'completed', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT '订单状态',
  alipay_order_no VARCHAR(64) DEFAULT NULL COMMENT '支付宝订单号',
  metadata JSON DEFAULT NULL COMMENT '额外元数据',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  paid_at TIMESTAMP NULL DEFAULT NULL COMMENT '支付时间',
  completed_at TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',
  cancelled_at TIMESTAMP NULL DEFAULT NULL COMMENT '取消时间',
  refunded_at TIMESTAMP NULL DEFAULT NULL COMMENT '退款时间',
  INDEX idx_user_address (user_address),
  INDEX idx_status (status),
  INDEX idx_alipay_order_no (alipay_order_no),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单信息表';

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  order_id VARCHAR(64) NOT NULL COMMENT '订单ID',
  payment_type ENUM('alipay', 'wechat', 'crypto') NOT NULL COMMENT '支付类型',
  transaction_hash VARCHAR(66) DEFAULT NULL COMMENT '区块链交易哈希',
  alipay_trade_no VARCHAR(64) DEFAULT NULL COMMENT '支付宝交易号',
  amount DECIMAL(10, 2) NOT NULL COMMENT '支付金额',
  currency VARCHAR(10) NOT NULL COMMENT '货币类型',
  status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
  notify_data JSON DEFAULT NULL COMMENT '支付通知原始数据',
  error_message TEXT DEFAULT NULL COMMENT '错误信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_order_id (order_id),
  INDEX idx_transaction_hash (transaction_hash),
  INDEX idx_alipay_trade_no (alipay_trade_no),
  INDEX idx_status (status),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- AGC积分余额表
CREATE TABLE IF NOT EXISTS agc_balances (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  user_address VARCHAR(42) NOT NULL COMMENT '用户钱包地址',
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0 COMMENT '当前余额',
  total_earned DECIMAL(20, 8) NOT NULL DEFAULT 0 COMMENT '累计获得',
  total_spent DECIMAL(20, 8) NOT NULL DEFAULT 0 COMMENT '累计消费',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_user_address (user_address),
  INDEX idx_balance (balance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AGC积分余额表';

-- 积分交易记录表
CREATE TABLE IF NOT EXISTS agc_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  user_address VARCHAR(42) NOT NULL COMMENT '用户钱包地址',
  transaction_type ENUM('purchase', 'spend', 'refund', 'reward', 'transfer_in', 'transfer_out') NOT NULL COMMENT '交易类型',
  amount DECIMAL(20, 8) NOT NULL COMMENT '交易金额',
  order_id VARCHAR(64) DEFAULT NULL COMMENT '关联订单ID',
  transaction_hash VARCHAR(66) DEFAULT NULL COMMENT '区块链交易哈希',
  description VARCHAR(255) DEFAULT NULL COMMENT '交易描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_address (user_address),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_order_id (order_id),
  INDEX idx_transaction_hash (transaction_hash),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AGC积分交易记录表';

-- 支付宝通知日志表
CREATE TABLE IF NOT EXISTS alipay_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  notify_id VARCHAR(64) NOT NULL COMMENT '支付宝通知ID',
  notify_type VARCHAR(50) NOT NULL COMMENT '通知类型',
  out_trade_no VARCHAR(64) NOT NULL COMMENT '商户订单号',
  trade_no VARCHAR(64) NOT NULL COMMENT '支付宝交易号',
  trade_status VARCHAR(20) NOT NULL COMMENT '交易状态',
  total_amount DECIMAL(10, 2) NOT NULL COMMENT '订单金额',
  buyer_id VARCHAR(32) DEFAULT NULL COMMENT '买家支付宝用户号',
  buyer_logon_id VARCHAR(100) DEFAULT NULL COMMENT '买家支付宝账号',
  notify_data JSON NOT NULL COMMENT '完整通知数据',
  verified BOOLEAN DEFAULT FALSE COMMENT '签名验证结果',
  processed BOOLEAN DEFAULT FALSE COMMENT '是否已处理',
  processed_at TIMESTAMP NULL DEFAULT NULL COMMENT '处理时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_notify_id (notify_id),
  INDEX idx_out_trade_no (out_trade_no),
  INDEX idx_trade_no (trade_no),
  INDEX idx_trade_status (trade_status),
  INDEX idx_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付宝通知日志表';
`;

export default CREATE_TABLES_SQL;
