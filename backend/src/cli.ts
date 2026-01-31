import dotenv from 'dotenv';
import DatabaseService from './database/service';
import ArbitrageEngine from './arbitrage/engine';
import ApiServer from './server';

// 加载环境变量
dotenv.config();

/**
 * 命令行启动脚本（同时启动套利监控 + HTTP API 服务器）
 */
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Contract Arbitrage Monitoring System        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // 初始化数据库
  const db = new DatabaseService();
  
  console.log('🔗 Testing database connection...');
  const isConnected = await db.testConnection();
  
  if (!isConnected) {
    console.error('\n❌ Failed to connect to database');
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  }

  // 启动 HTTP API 服务器（提供 /api/statistics 等接口）
  const apiServer = new ApiServer();
  await apiServer.start();

  // 初始化套利引擎
  const engine = new ArbitrageEngine(db);

  // 启动监控
  await engine.start();

  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n\n⚠ Received SIGINT signal');
    engine.stop();
    db.close().then(() => {
      console.log('✓ Database connection closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n\n⚠ Received SIGTERM signal');
    engine.stop();
    db.close().then(() => {
      console.log('✓ Database connection closed');
      process.exit(0);
    });
  });
}

// 运行主函数
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
