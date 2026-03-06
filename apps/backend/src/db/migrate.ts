import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Resolve .env relative to this file (src/db/) → apps/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations(): Promise<void> {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  console.log('Connected to database. Running migrations...');

  // Ensure migrations meta-table exists
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // __dirname = dist/db/ after tsc, src/db/ under ts-node — SQL files are always in migrations/
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM migrations WHERE name = ?',
      [file],
    );

    if (rows.length > 0) {
      console.log(`  ⏭  Skipping ${file} (already executed)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`  ▶  Running ${file}`);
    await conn.query(sql);
    await conn.execute('INSERT INTO migrations (name) VALUES (?)', [file]);
    console.log(`  ✅  Done: ${file}`);
  }

  await conn.end();
  console.log('All migrations completed.');
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
