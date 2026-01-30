# 后端服务部署指南

## 🚀 生产环境部署

### 方式一：传统部署 (Linux服务器)

#### 1. 准备服务器环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# 安装进程管理器
sudo npm install -g pm2
```

#### 2. 配置PostgreSQL

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE arbitrage_db;
CREATE USER arbitrage_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE arbitrage_db TO arbitrage_user;
\q

# 允许远程连接 (可选)
sudo nano /etc/postgresql/14/main/pg_hba.conf
# 添加: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

#### 3. 部署应用

```bash
# 创建应用目录
mkdir -p /var/www/arbitrage-backend
cd /var/www/arbitrage-backend

# 上传代码 (使用git或scp)
git clone <your-repo> .
# 或
scp -r ./backend/* user@server:/var/www/arbitrage-backend/

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env
```

**.env 生产配置：**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arbitrage_db
DB_USER=arbitrage_user
DB_PASSWORD=strong_password

PORT=3001
NODE_ENV=production

CHECK_INTERVAL_MS=5000
MIN_PROFIT_THRESHOLD=0.3
```

#### 4. 导入数据库结构

```bash
psql -U arbitrage_user -d arbitrage_db -f database/schema.sql
```

#### 5. 编译TypeScript

```bash
npm run build
```

#### 6. 使用PM2启动

```bash
# 启动监控引擎
pm2 start dist/cli.js --name arbitrage-engine

# 启动API服务器
pm2 start dist/server.js --name arbitrage-api

# 保存PM2配置
pm2 save
pm2 startup
```

#### 7. 配置Nginx反向代理 (可选)

```bash
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/arbitrage-api
```

**Nginx配置：**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/arbitrage-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. 配置SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### 方式二：Docker部署

#### 1. 创建Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 编译TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/cli.js"]
```

#### 2. 创建docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: arbitrage_db
      POSTGRES_USER: arbitrage_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U arbitrage_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: arbitrage_db
      DB_USER: arbitrage_user
      DB_PASSWORD: ${DB_PASSWORD}
      PORT: 3001
      NODE_ENV: production
    ports:
      - "3001:3001"
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

#### 3. 部署

```bash
# 设置环境变量
echo "DB_PASSWORD=strong_password" > .env

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f api

# 停止
docker-compose down
```

---

### 方式三：云平台部署

#### AWS部署

**使用AWS RDS + EC2：**

1. **创建RDS PostgreSQL实例**
   - 选择PostgreSQL 14
   - 配置安全组允许EC2访问
   - 记录endpoint和凭证

2. **创建EC2实例**
   - Ubuntu 22.04 LTS
   - t2.micro或更大
   - 配置安全组开放API端口

3. **部署应用**
   ```bash
   ssh ubuntu@<ec2-ip>
   # 按照传统部署方式进行
   ```

#### Heroku部署

```bash
# 安装Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 登录
heroku login

# 创建应用
heroku create arbitrage-backend

# 添加PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 配置环境变量
heroku config:set NODE_ENV=production
heroku config:set CHECK_INTERVAL_MS=5000

# 部署
git push heroku main

# 导入数据库
heroku pg:psql < database/schema.sql
```

#### DigitalOcean App Platform

1. 连接GitHub仓库
2. 选择Node.js环境
3. 添加PostgreSQL数据库
4. 配置环境变量
5. 自动部署

---

## 🔧 生产环境配置

### PM2生态系统配置

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'arbitrage-engine',
      script: './dist/cli.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/engine-error.log',
      out_file: './logs/engine-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M'
    },
    {
      name: 'arbitrage-api',
      script: './dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '300M'
    }
  ]
};
```

启动：
```bash
pm2 start ecosystem.config.js
```

### 日志管理

```bash
# 创建日志目录
mkdir -p logs

# 配置logrotate
sudo nano /etc/logrotate.d/arbitrage
```

```
/var/www/arbitrage-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 数据库备份

**自动备份脚本：**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/arbitrage"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="arbitrage_db_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U arbitrage_user arbitrage_db > $BACKUP_DIR/$FILENAME

# 压缩
gzip $BACKUP_DIR/$FILENAME

# 删除30天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

**添加到crontab：**
```bash
crontab -e
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 监控设置

**使用PM2监控：**
```bash
pm2 install pm2-logrotate
pm2 install pm2-server-monit
pm2 monit
```

**使用New Relic/DataDog (可选)：**
```bash
npm install newrelic
# 配置newrelic.js
```

---

## 📊 性能优化

### 数据库优化

```sql
-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM arbitrage_opportunities 
WHERE detected_at >= NOW() - INTERVAL '24 hours';

-- 更新统计信息
ANALYZE arbitrage_opportunities;
ANALYZE funding_rates;

-- 配置PostgreSQL
-- /etc/postgresql/14/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
work_mem = 16MB
```

### Node.js优化

```javascript
// 使用cluster模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 启动应用
  require('./server');
}
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. 限流

使用express-rate-limit:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### 3. API认证 (可选)

```javascript
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access denied');
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(400).send('Invalid token');
  }
};
```

---

## 📈 监控和告警

### 健康检查端点

已实现：`GET /api/health`

### 告警配置

使用webhook发送告警：

```typescript
async function sendAlert(message: string) {
  await axios.post(process.env.WEBHOOK_URL, {
    text: `[Arbitrage Alert] ${message}`
  });
}

// 在关键错误处调用
if (error) {
  await sendAlert(`Database connection failed: ${error.message}`);
}
```

---

## 🆘 故障恢复

### 常见问题

1. **内存泄漏**
   ```bash
   pm2 restart all
   ```

2. **数据库连接池耗尽**
   ```sql
   SELECT * FROM pg_stat_activity;
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE datname = 'arbitrage_db' AND state = 'idle';
   ```

3. **磁盘空间不足**
   ```bash
   # 清理旧日志
   pm2 flush
   
   # 清理旧数据
   psql arbitrage_db -c "SELECT cleanup_old_data(7);"
   ```

---

## 📝 部署检查清单

- [ ] 安装所有依赖
- [ ] 配置环境变量
- [ ] 创建并初始化数据库
- [ ] 编译TypeScript代码
- [ ] 配置进程管理器
- [ ] 设置日志轮转
- [ ] 配置定时备份
- [ ] 设置监控告警
- [ ] 配置防火墙
- [ ] 配置SSL证书
- [ ] 测试所有API端点
- [ ] 压力测试

---

完成部署后访问：
- API: http://your-server:3001/api/health
- 监控: `pm2 monit`
