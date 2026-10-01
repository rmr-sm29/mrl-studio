/**
 * Aplica db/schema.sql a la base de datos de DATABASE_URL (se lee de .env.local si no está en el entorno).
 * Uso: npm run db:migrate
 */
import { readFileSync, existsSync } from 'node:fs';
import { Pool } from '@neondatabase/serverless';

const envFile = new URL('../.env.local', import.meta.url);
if (!process.env.DATABASE_URL && existsSync(envFile)) {
  const line = readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
  if (line) process.env.DATABASE_URL = line.slice('DATABASE_URL='.length).replace(/^"(.*)"$/, '$1');
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL (ejecuta `npx vercel env pull .env.local`).');
  process.exit(1);
}

const schema = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(schema);
  const { rows } = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  console.log(`✓ Esquema aplicado. Tablas: ${rows.map((r) => r.table_name).join(', ')}`);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
