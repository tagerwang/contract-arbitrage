/**
 * 数据库初始化脚本（MySQL 8）
 * - 若 arbitrage_db 不存在则创建
 * - 执行 database/schema-mysql.sql 建表
 *
 * 使用: npm run db:init
 * 需先在 .env 中配置正确的 DB_* 和 MySQL 用户密码
 */
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'arbitrage_db';

/**
 * 将 SQL 文件按语句分割（按 ; 分割，跳过注释）
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  const lines = sql.split('\n');
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;

    current += line + '\n';
    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 1) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  const last = current.trim();
  if (last.length > 1) {
    statements.push(last);
  }

  return statements.filter((s) => s.length > 0);
}

async function main(): Promise<void> {
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  if (baseConfig.password === undefined || baseConfig.password === null) {
    console.error('❌ 请在 .env 中设置 DB_PASSWORD（你的 MySQL 密码）');
    process.exit(1);
  }

  let conn: mysql.Connection | null = null;

  try {
    console.log('🔗 连接 MySQL（无库）...');
    conn = await mysql.createConnection({
      ...baseConfig,
      multipleStatements: false,
    });

    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [DB_NAME]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`📦 创建数据库 ${DB_NAME}...`);
      await conn.query(`CREATE DATABASE \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✓ 数据库 ${DB_NAME} 已创建`);
    } else {
      console.log(`✓ 数据库 ${DB_NAME} 已存在`);
    }
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : typeof err === 'object' ? JSON.stringify(err) : String(err);
    console.error('❌ 连接/创建数据库失败:', msg || '(无详情，请检查 MySQL 是否已启动)');
    console.error('\n请确认：');
    console.error('  1. MySQL 8 已启动');
    console.error('  2. .env 中 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD 正确（DB_PASSWORD 改为本机密码）');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }

  const schemaPath = path.join(__dirname, '../../database/schema-mysql.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ 未找到 database/schema-mysql.sql');
    process.exit(1);
  }

  const schemaConn = await mysql.createConnection({
    ...baseConfig,
    database: DB_NAME,
    multipleStatements: false,
  });

  try {
    console.log('🔗 连接数据库', DB_NAME, '...');

    const sql = fs.readFileSync(schemaPath, 'utf-8');
    const statements = splitSqlStatements(sql);

    console.log(`📄 执行 schema（共 ${statements.length} 条语句）...`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.startsWith('--') || stmt.length < 2) continue;
      try {
        await schemaConn.query(stmt);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const isAlreadyExists =
          msg.includes('already exists') ||
          msg.includes('duplicate key') ||
          msg.includes('Duplicate');
        if (isAlreadyExists) {
          // 表/索引/视图已存在，忽略
        } else {
          console.warn(`⚠ 语句 ${i + 1} 执行警告:`, msg);
        }
      }
    }

    console.log('✓ Schema 执行完成');
  } catch (err) {
    console.error('❌ 执行 schema 失败:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await schemaConn.end();
  }

  console.log('\n✅ 数据库初始化完成，可以运行 npm run dev');
}

main();
