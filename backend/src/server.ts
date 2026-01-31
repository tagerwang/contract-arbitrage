import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRouter from './routes/stats';
import DatabaseService from './database/service';

// 加载环境变量
dotenv.config();

/**
 * API服务器
 */
export class ApiServer {
  private app: Express;
  private port: number;
  private db: DatabaseService;

  constructor(port?: number) {
    this.app = express();
    this.port = port || parseInt(process.env.PORT || '3001');
    this.db = new DatabaseService();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // JSON解析
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // API 路由（带 /api 前缀）
    this.app.use('/api', statsRouter);
    // 无前缀路由（/opportunities、/statistics 等也可直接访问）
    this.app.use('/', statsRouter);

    // 根路径
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'Contract Arbitrage API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          opportunities: '/api/opportunities',
          latestOpportunities: '/api/opportunities/latest',
          latestFundingRates: '/api/funding-rates/latest',
          fundingRateHistory: '/api/funding-rates/history',
          statistics: '/api/statistics',
          health: '/api/health'
        }
      });
    });

    // 404处理
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: Date.now()
      });
    });

    // 错误处理
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('Server error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: Date.now()
      });
    });
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      // 测试数据库连接
      const isConnected = await this.db.testConnection();
      if (!isConnected) {
        console.error('Failed to connect to database');
        process.exit(1);
      }

      // 启动HTTP服务器
      this.app.listen(this.port, () => {
        console.log(`\n🚀 API Server running on port ${this.port}`);
        console.log(`📡 http://localhost:${this.port}`);
        console.log(`\nAvailable endpoints:`);
        console.log(`  GET  /api/opportunities`);
        console.log(`  GET  /api/opportunities/latest`);
        console.log(`  GET  /api/funding-rates/latest`);
        console.log(`  GET  /api/funding-rates/history`);
        console.log(`  GET  /api/statistics`);
        console.log(`  GET  /api/health`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * 获取Express实例
   */
  getApp(): Express {
    return this.app;
  }
}

export default ApiServer;

// 如果直接运行此文件
if (require.main === module) {
  const server = new ApiServer();
  server.start();
}
