-- ==================== MySQL 8 建表脚本 ====================
-- 使用前请先创建数据库: CREATE DATABASE IF NOT EXISTS arbitrage_db;

-- ==================== 资金费率表 ====================
CREATE TABLE IF NOT EXISTS funding_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exchange VARCHAR(20) NOT NULL COMMENT '交易所',
    symbol VARCHAR(20) NOT NULL COMMENT '交易对',
    funding_rate DECIMAL(10, 8) NOT NULL COMMENT '资金费率(小数)',
    funding_time DATETIME(3) NOT NULL COMMENT '下次结算时间',
    mark_price DECIMAL(20, 8) NULL COMMENT '标记价格',
    index_price DECIMAL(20, 8) NULL COMMENT '指数价格',
    recorded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '记录时间',
    CONSTRAINT funding_rates_check CHECK (funding_rate BETWEEN -1 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='资金费率历史记录表';

CREATE INDEX idx_funding_rates_symbol ON funding_rates(symbol);
CREATE INDEX idx_funding_rates_exchange ON funding_rates(exchange);
CREATE INDEX idx_funding_rates_recorded_at ON funding_rates(recorded_at DESC);
CREATE INDEX idx_funding_rates_composite ON funding_rates(symbol, exchange, recorded_at DESC);

-- ==================== 套利机会表 ====================
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL COMMENT '交易对',
    long_exchange VARCHAR(20) NOT NULL COMMENT '做多交易所',
    short_exchange VARCHAR(20) NOT NULL COMMENT '做空交易所',
    long_rate DECIMAL(10, 6) NOT NULL COMMENT '做多资金费率(%)',
    short_rate DECIMAL(10, 6) NOT NULL COMMENT '做空资金费率(%)',
    spread_rate DECIMAL(10, 6) NOT NULL COMMENT '费率差(%)',
    annualized_return DECIMAL(10, 2) NOT NULL COMMENT '年化收益率(%)',
    next_funding_time BIGINT NOT NULL COMMENT '下次资金费率结算时间戳(毫秒)',
    funding_period_hours TINYINT NULL COMMENT '资金费率结算周期(小时)，1/4/8等；无值时年化计算默认用8',
    long_price DECIMAL(20, 8) NOT NULL COMMENT '做多价格',
    short_price DECIMAL(20, 8) NOT NULL COMMENT '做空价格',
    price_diff DECIMAL(20, 8) NOT NULL COMMENT '价格差',
    price_spread_percent DECIMAL(10, 4) NOT NULL COMMENT '价格差(%)',
    confidence DECIMAL(3, 2) NOT NULL COMMENT '置信度',
    detected_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '检测时间',
    CONSTRAINT arb_opp_spread_positive CHECK (spread_rate >= 0),
    CONSTRAINT arb_opp_confidence CHECK (confidence BETWEEN 0 AND 1),
    CONSTRAINT arb_opp_different_exchanges CHECK (long_exchange != short_exchange)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='套利机会记录表';

CREATE INDEX idx_arb_opp_symbol ON arbitrage_opportunities(symbol);
CREATE INDEX idx_arb_opp_detected_at ON arbitrage_opportunities(detected_at DESC);
CREATE INDEX idx_arb_opp_spread_rate ON arbitrage_opportunities(spread_rate DESC);
CREATE INDEX idx_arb_opp_composite ON arbitrage_opportunities(symbol, detected_at DESC, spread_rate DESC);

-- ==================== 价格历史表 ====================
CREATE TABLE IF NOT EXISTS price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exchange VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    bid_price DECIMAL(20, 8) NULL,
    ask_price DECIMAL(20, 8) NULL,
    volume_24h DECIMAL(30, 8) NULL,
    recorded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='价格历史记录表';

CREATE INDEX idx_price_history_symbol ON price_history(symbol);
CREATE INDEX idx_price_history_exchange ON price_history(exchange);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- ==================== 视图（可选） ====================
-- 最新资金费率视图
CREATE OR REPLACE VIEW v_latest_funding_rates AS
SELECT id, exchange, symbol, funding_rate, funding_time, mark_price, index_price, recorded_at
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY exchange, symbol ORDER BY recorded_at DESC) AS rn
    FROM funding_rates
) t WHERE rn = 1;

-- 最新套利机会视图
CREATE OR REPLACE VIEW v_latest_opportunities AS
SELECT id, symbol, long_exchange, short_exchange, long_rate, short_rate, spread_rate,
       annualized_return, next_funding_time, funding_period_hours,
       long_price, short_price, price_diff, price_spread_percent, confidence, detected_at
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY symbol, long_exchange, short_exchange ORDER BY detected_at DESC) AS rn
    FROM arbitrage_opportunities
) t WHERE rn = 1;

-- 统计视图（最近24小时）
CREATE OR REPLACE VIEW v_statistics_24h AS
SELECT
    COUNT(*) AS total_opportunities,
    AVG(spread_rate) AS avg_spread,
    AVG(annualized_return) AS avg_annualized_return,
    MAX(spread_rate) AS max_spread,
    MIN(spread_rate) AS min_spread
FROM arbitrage_opportunities
WHERE detected_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- ==================== 迁移：为已有 arbitrage_opportunities 表添加新字段 ====================
-- 若表已存在，执行以下语句添加 next_funding_time、funding_period_hours 列
-- ALTER TABLE arbitrage_opportunities ADD COLUMN next_funding_time BIGINT NULL COMMENT '下次资金费率结算时间戳(毫秒)' AFTER annualized_return;
-- ALTER TABLE arbitrage_opportunities ADD COLUMN funding_period_hours TINYINT NOT NULL DEFAULT 8 COMMENT '资金费率结算周期(小时)' AFTER next_funding_time;
-- UPDATE arbitrage_opportunities SET next_funding_time = UNIX_TIMESTAMP(detected_at) * 1000, funding_period_hours = 8 WHERE next_funding_time IS NULL;
-- ALTER TABLE arbitrage_opportunities MODIFY COLUMN next_funding_time BIGINT NOT NULL;

SELECT 'Database schema created successfully!' AS status;
