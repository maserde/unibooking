import mysql from 'mysql2/promise';
import { env } from './env';
import { logger } from './logger';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryParams = any[];

export async function query<T = unknown>(sql: string, params?: QueryParams): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = unknown>(sql: string, params?: QueryParams): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: QueryParams): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  logger.info('Database connection established');
  conn.release();
}
