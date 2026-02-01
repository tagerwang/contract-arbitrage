/**
 * PM2 进程守护配置 - 合约套利监控系统
 * 应用名使用 contract-arbitrage-* 前缀，避免与已有服务冲突
 * 在项目根目录执行: pm2 start deploy/ecosystem.config.cjs
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');

module.exports = {
  apps: [
    {
      name: 'contract-arbitrage-api',
      script: path.join(BACKEND, 'dist/server.js'),
      cwd: BACKEND, // dotenv 从 cwd 加载 .env
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      error_file: path.join(ROOT, 'logs/api-error.log'),
      out_file: path.join(ROOT, 'logs/api-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '300M',
      autorestart: true,
      watch: false
    },
    {
      name: 'contract-arbitrage-engine',
      script: path.join(BACKEND, 'dist/cli.js'),
      cwd: BACKEND, // dotenv 从 cwd 加载 .env
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      error_file: path.join(ROOT, 'logs/engine-error.log'),
      out_file: path.join(ROOT, 'logs/engine-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
