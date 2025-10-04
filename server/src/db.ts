// 🚨 DEV ONLY: desativa verificação de CA só neste processo
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // mantenha ?sslmode=require na URL
  ssl: true as any,                            // usa TLS (com no-verify pela linha 1)
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export async function pingDB() {
  const r = await pool.query('select now() as now');
  return r.rows[0]?.now;
}
