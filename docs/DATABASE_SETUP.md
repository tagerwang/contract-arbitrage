# 数据库配置指南

## PostgreSQL安装

### macOS

```bash
brew install postgresql@14
brew services start postgresql
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows

从 [PostgreSQL官网](https://www.postgresql.org/download/windows/) 下载安装器

## 创建数据库

```bash
# 使用默认用户
createdb arbitrage_db

# 或指定用户
createdb -U postgres arbitrage_db
```

## 导入Schema

```bash
psql -d arbitrage_db -f backend/database/schema.sql
```

## 数据库结构

### 表结构

1. **funding_rates** - 资金费率记录
2. **arbitrage_opportunities** - 套利机会记录  
3. **price_history** - 价格历史记录

### 索引

为高频查询字段创建了索引以优化性能

### 视图

- `v_latest_funding_rates` - 最新费率
- `v_latest_opportunities` - 最新机会
- `v_statistics_24h` - 24小时统计

## 连接配置

### 环境变量

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 连接池配置

在代码中可调整:
- `max`: 最大连接数 (默认20)
- `idleTimeoutMillis`: 空闲超时 (默认30000)
- `connectionTimeoutMillis`: 连接超时 (默认2000)

## 数据维护

### 清理旧数据

```sql
SELECT * FROM cleanup_old_data(30); -- 保留30天
```

### 备份数据库

```bash
pg_dump arbitrage_db > backup.sql
```

### 恢复数据库

```bash
psql arbitrage_db < backup.sql
```

## 性能优化

### 定期清理

设置定时任务清理旧数据:

```bash
# crontab -e
0 2 * * * psql arbitrage_db -c "SELECT cleanup_old_data(30);"
```

### 监控查询

```sql
-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## 故障排除

### 连接被拒绝

检查 `pg_hba.conf`:
```
host    all    all    127.0.0.1/32    md5
```

### 权限问题

```sql
GRANT ALL ON DATABASE arbitrage_db TO your_user;
```
