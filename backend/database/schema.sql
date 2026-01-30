-- ==================== 创建数据库 ====================
-- 如果数据库不存在，创建它
-- CREATE DATABASE arbitrage_db;

-- 连接到数据库
-- \c arbitrage_db;

-- ==================== 资金费率表 ====================
CREATE TABLE IF NOT EXISTS funding_rates (
    id SERIAL PRIMARY KEY,
    exchange VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    funding_rate DECIMAL(10, 8) NOT NULL,
    funding_time TIMESTAMP NOT NULL,
    mark_price DECIMAL(20, 8),
    index_price DECIMAL(20, 8),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引优化查询
    CONSTRAINT funding_rates_check CHECK (funding_rate BETWEEN -1 AND 1)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_funding_rates_symbol ON funding_rates(symbol);
CREATE INDEX IF NOT EXISTS idx_funding_rates_exchange ON funding_rates(exchange);
CREATE INDEX IF NOT EXISTS idx_funding_rates_recorded_at ON funding_rates(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_funding_rates_composite ON funding_rates(symbol, exchange, recorded_at DESC);

-- ==================== 套利机会表 ====================
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    long_exchange VARCHAR(20) NOT NULL,
    short_exchange VARCHAR(20) NOT NULL,
    long_rate DECIMAL(10, 6) NOT NULL,
    short_rate DECIMAL(10, 6) NOT NULL,
    spread_rate DECIMAL(10, 6) NOT NULL,
    annualized_return DECIMAL(10, 2) NOT NULL,
    long_price DECIMAL(20, 8) NOT NULL,
    short_price DECIMAL(20, 8) NOT NULL,
    price_diff DECIMAL(20, 8) NOT NULL,
    price_spread_percent DECIMAL(10, 4) NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT arb_opp_spread_positive CHECK (spread_rate >= 0),
    CONSTRAINT arb_opp_confidence CHECK (confidence BETWEEN 0 AND 1),
    CONSTRAINT arb_opp_different_exchanges CHECK (long_exchange != short_exchange)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_arb_opp_symbol ON arbitrage_opportunities(symbol);
CREATE INDEX IF NOT EXISTS idx_arb_opp_detected_at ON arbitrage_opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_opp_spread_rate ON arbitrage_opportunities(spread_rate DESC);
CREATE INDEX IF NOT EXISTS idx_arb_opp_composite ON arbitrage_opportunities(symbol, detected_at DESC, spread_rate DESC);

-- ==================== 价格历史表 ====================
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    exchange VARCHAR(20) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    bid_price DECIMAL(20, 8),
    ask_price DECIMAL(20, 8),
    volume_24h DECIMAL(30, 8),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_exchange ON price_history(exchange);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- ==================== 创建视图 ====================

-- 最新资金费率视图
CREATE OR REPLACE VIEW v_latest_funding_rates AS
SELECT DISTINCT ON (exchange, symbol)
    id,
    exchange,
    symbol,
    funding_rate,
    funding_time,
    mark_price,
    index_price,
    recorded_at
FROM funding_rates
ORDER BY exchange, symbol, recorded_at DESC;

-- 最新套利机会视图
CREATE OR REPLACE VIEW v_latest_opportunities AS
SELECT DISTINCT ON (symbol, long_exchange, short_exchange)
    id,
    symbol,
    long_exchange,
    short_exchange,
    long_rate,
    short_rate,
    spread_rate,
    annualized_return,
    long_price,
    short_price,
    price_diff,
    price_spread_percent,
    confidence,
    detected_at
FROM arbitrage_opportunities
ORDER BY symbol, long_exchange, short_exchange, detected_at DESC;

-- 统计视图（最近24小时）
CREATE OR REPLACE VIEW v_statistics_24h AS
SELECT
    COUNT(*) as total_opportunities,
    AVG(spread_rate) as avg_spread,
    AVG(annualized_return) as avg_annualized_return,
    MAX(spread_rate) as max_spread,
    MIN(spread_rate) as min_spread
FROM arbitrage_opportunities
WHERE detected_at >= NOW() - INTERVAL '24 hours';

-- ==================== 存储过程 ====================

-- 清理旧数据
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE(
    funding_rates_deleted INTEGER,
    opportunities_deleted INTEGER,
    price_history_deleted INTEGER
) AS $$
DECLARE
    fr_count INTEGER;
    ao_count INTEGER;
    ph_count INTEGER;
BEGIN
    -- 删除旧的资金费率
    DELETE FROM funding_rates
    WHERE recorded_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS fr_count = ROW_COUNT;
    
    -- 删除旧的套利机会
    DELETE FROM arbitrage_opportunities
    WHERE detected_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS ao_count = ROW_COUNT;
    
    -- 删除旧的价格历史
    DELETE FROM price_history
    WHERE recorded_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS ph_count = ROW_COUNT;
    
    RETURN QUERY SELECT fr_count, ao_count, ph_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== 示例查询 ====================

-- 查询最新的套利机会
-- SELECT * FROM arbitrage_opportunities
-- WHERE detected_at >= NOW() - INTERVAL '1 hour'
-- ORDER BY spread_rate DESC
-- LIMIT 10;

-- 查询特定交易对的历史费率
-- SELECT * FROM funding_rates
-- WHERE symbol = 'BTCUSDT' AND exchange = 'binance'
-- ORDER BY recorded_at DESC
-- LIMIT 100;

-- 获取统计数据
-- SELECT * FROM v_statistics_24h;

-- 清理30天前的数据
-- SELECT * FROM cleanup_old_data(30);

-- ==================== 权限设置 ====================
-- 如果需要为特定用户授权
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- ==================== 完成 ====================
COMMENT ON TABLE funding_rates IS '资金费率历史记录表';
COMMENT ON TABLE arbitrage_opportunities IS '套利机会记录表';
COMMENT ON TABLE price_history IS '价格历史记录表';

SELECT 'Database schema created successfully!' as status;
