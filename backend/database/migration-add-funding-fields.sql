-- ==================== 迁移：为 arbitrage_opportunities 添加 next_funding_time、funding_period_hours ====================
-- 若表已存在但缺少新字段，执行本脚本（若列已存在会报错，可忽略）

-- 1. 添加 next_funding_time（先允许 NULL，便于 UPDATE 填充已有数据）
ALTER TABLE arbitrage_opportunities
ADD COLUMN next_funding_time BIGINT NULL COMMENT '下次资金费率结算时间戳(毫秒)' AFTER annualized_return;

-- 2. 添加 funding_period_hours
ALTER TABLE arbitrage_opportunities
ADD COLUMN funding_period_hours TINYINT NULL COMMENT '资金费率结算周期(小时)，1/4/8等；无值时年化计算默认用8' AFTER next_funding_time;

-- 3. 为已有记录填充 next_funding_time（funding_period_hours 无值时保持 NULL）
UPDATE arbitrage_opportunities
SET next_funding_time = UNIX_TIMESTAMP(detected_at) * 1000
WHERE next_funding_time IS NULL;

-- 4. next_funding_time 改为 NOT NULL
ALTER TABLE arbitrage_opportunities MODIFY COLUMN next_funding_time BIGINT NOT NULL;
