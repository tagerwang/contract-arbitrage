#!/bin/bash
# 合约套利系统 - 部署到服务器
# 从 .env 读取配置，参考 analysis-crypto-trade-web 部署结构

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# 读取 .env 配置
if [ ! -f .env ]; then
  echo "❌ 错误：找不到 .env 文件"
  echo "请先复制 .env.deploy.example 为 .env 并配置："
  echo "  cp .env.deploy.example .env"
  echo "  编辑 .env 填写 BASE_DOMAIN、SERVER_IP、SERVER_USER"
  exit 1
fi

BASE_DOMAIN=$(grep "^BASE_DOMAIN=" .env | cut -d '=' -f2)
if [ -z "$BASE_DOMAIN" ]; then
  echo "❌ 错误：.env 中未配置 BASE_DOMAIN"
  exit 1
fi

SERVER_IP=$(grep "^SERVER_IP=" .env | cut -d '=' -f2)
if [ -z "$SERVER_IP" ]; then
  echo "❌ 错误：.env 中未配置 SERVER_IP"
  exit 1
fi

SERVER_USER=$(grep "^SERVER_USER=" .env | cut -d '=' -f2)
SERVER_USER=${SERVER_USER:-root}

NEW_DOMAINS=$(grep "^NEW_DOMAINS=" .env | cut -d '=' -f2)
MAIN_DOMAIN=$(echo "$NEW_DOMAINS" | cut -d ',' -f1)
MAIN_DOMAIN=${MAIN_DOMAIN:-$BASE_DOMAIN}

DEPLOY_DIR=$(grep "^DEPLOY_DIR=" .env | cut -d '=' -f2)
DEPLOY_DIR=${DEPLOY_DIR:-/var/www/contract-arbitrage}

APP_NAME_API="contract-arbitrage-api"
APP_NAME_ENGINE="contract-arbitrage-engine"
APP_PORT="3001"
VITE_API_BASE_URL="/api"

echo "🚀 开始部署合约套利系统到服务器..."
echo "📍 目标: ${SERVER_USER}@<server>"
echo "📁 目录: $DEPLOY_DIR"
echo "🌐 域名: $MAIN_DOMAIN"
echo ""

# 1. 检查服务器连接
echo "📡 步骤 1/6: 检查服务器连接..."
if ! ssh "$SERVER_USER@$SERVER_IP" "echo '连接成功'" > /dev/null 2>&1; then
  echo "❌ 无法连接到服务器"
  exit 1
fi
echo "✅ 服务器连接正常"
echo ""

# 2. 检查 Node.js 和 pm2
echo "📦 步骤 2/6: 检查依赖..."
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
if ! command -v node &> /dev/null; then
  echo "安装 Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
if ! command -v pm2 &> /dev/null; then
  echo "安装 pm2..."
  npm install -g pm2
fi
echo "Node.js: $(node -v) | pm2: $(pm2 -v)"
ENDSSH
echo "✅ 依赖检查完成"
echo ""

# 3. 创建应用目录
echo "📁 步骤 3/6: 创建应用目录..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $DEPLOY_DIR"
echo "✅ 目录创建完成"
echo ""

# 4. 同步代码
echo "📤 步骤 4/6: 上传应用文件..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude 'logs' \
  --exclude '.env' \
  "$PROJECT_ROOT/" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/"

rsync -avz --progress \
  "$PROJECT_ROOT/deploy/" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/deploy/"

# 若本地有 backend/.env，同步到服务器（首次部署必需）
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
  echo "上传 backend/.env..."
  scp "$PROJECT_ROOT/backend/.env" "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/backend/.env"
fi
echo "✅ 文件上传成功"
echo ""

# 5. 安装依赖并启动服务
echo "🔧 步骤 5/6: 安装依赖并启动服务..."
ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
export DEPLOY_DIR="$DEPLOY_DIR"
export VITE_API_BASE_URL="$VITE_API_BASE_URL"

# 检查 backend .env
if [ ! -f "$DEPLOY_DIR/backend/.env" ]; then
  echo "警告: backend/.env 不存在，已从 .env.example 复制"
  cp "$DEPLOY_DIR/backend/.env.example" "$DEPLOY_DIR/backend/.env"
  echo "请编辑 $DEPLOY_DIR/backend/.env 填写数据库等配置后重新部署"
  exit 1
fi

# 后端（需 devDependencies 用于 tsc 编译）
cd "$DEPLOY_DIR/backend"
npm install
npm run build

# 前端 Dashboard（部署在 /arbitrage/）
cd "$DEPLOY_DIR/frontend-dashboard"
npm install
VITE_API_BASE_URL="$VITE_API_BASE_URL" VITE_BASE_PATH=/arbitrage/ npm run build

# 前端 API Manager（部署在 /arbitrage-api-manager/）
cd "$DEPLOY_DIR/frontend-api-manager"
npm install
VITE_API_BASE_URL="$VITE_API_BASE_URL" VITE_BASE_PATH=/arbitrage-api-manager/ npm run build

# PM2
cd "$DEPLOY_DIR"
mkdir -p logs

pm2 delete $APP_NAME_API $APP_NAME_ENGINE 2>/dev/null || true

if [ -f "$DEPLOY_DIR/deploy/ecosystem.config.cjs" ]; then
  pm2 start deploy/ecosystem.config.cjs
else
  pm2 start backend/dist/server.js --name $APP_NAME_API -o logs/api-out.log -e logs/api-error.log
  pm2 start backend/dist/cli.js --name $APP_NAME_ENGINE -o logs/engine-out.log -e logs/engine-error.log
fi

pm2 save
pm2 startup systemd -u $SERVER_USER --hp ~ 2>/dev/null || true

echo "服务状态:"
pm2 list | grep contract-arbitrage || pm2 list
ENDSSH

if [ $? -eq 0 ]; then
  echo "✅ 服务启动成功"
else
  echo "❌ 服务启动失败"
  exit 1
fi
echo ""

# 6. 配置 Nginx
echo "🌐 步骤 6/6: 配置 Nginx 反向代理..."
NGINX_CONF="$SCRIPT_DIR/${MAIN_DOMAIN}.nginx.conf"
NGINX_TEMPLATE="$SCRIPT_DIR/your-domain.com.nginx.conf.example"
if [ -f "$NGINX_CONF" ]; then
  scp "$NGINX_CONF" "$SERVER_USER@$SERVER_IP:/tmp/${MAIN_DOMAIN}.conf"
elif [ -f "$NGINX_TEMPLATE" ]; then
  sed "s/__DOMAIN__/$MAIN_DOMAIN/g" "$NGINX_TEMPLATE" | ssh "$SERVER_USER@$SERVER_IP" "cat > /tmp/${MAIN_DOMAIN}.conf"
fi
if [ -f "$NGINX_CONF" ] || [ -f "$NGINX_TEMPLATE" ]; then
  ssh "$SERVER_USER@$SERVER_IP" << ENDSSH
# 备份原配置
if [ -f /etc/nginx/sites-available/${MAIN_DOMAIN} ]; then
  cp /etc/nginx/sites-available/${MAIN_DOMAIN} /etc/nginx/sites-available/${MAIN_DOMAIN}.bak.\$(date +%Y%m%d_%H%M%S)
fi

cp /tmp/${MAIN_DOMAIN}.conf /etc/nginx/sites-available/${MAIN_DOMAIN}

if [ ! -L /etc/nginx/sites-enabled/${MAIN_DOMAIN} ]; then
  ln -sf /etc/nginx/sites-available/${MAIN_DOMAIN} /etc/nginx/sites-enabled/
fi

if nginx -t 2>/dev/null; then
  systemctl reload nginx
  echo "✅ Nginx 配置已重载"
else
  echo "❌ Nginx 配置测试失败，请检查"
  exit 1
fi
ENDSSH
fi
echo ""

# 7. 测试部署
echo "🧪 测试部署..."
sleep 2
echo "健康检查: curl -s https://${MAIN_DOMAIN}/api/health"
curl -s "https://${MAIN_DOMAIN}/api/health" 2>/dev/null | head -1 || echo "（需配置 DNS/SSL 后访问）"

echo ""
echo "==================================="
echo "✅ 部署完成！"
echo "==================================="
echo ""
echo "🌐 访问地址："
echo "  https://${MAIN_DOMAIN}/arbitrage/"
echo "  https://${MAIN_DOMAIN}/arbitrage-api-manager/"
echo ""
echo "📊 管理命令："
echo "  ssh <user>@<server> 'pm2 logs $APP_NAME_API'"
echo "  ssh <user>@<server> 'pm2 status'"
echo "  ssh <user>@<server> 'pm2 restart $APP_NAME_API'"
echo ""
