import pg from 'pg';

const { Pool } = pg;

// Create PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'llmuser',
  password: process.env.POSTGRES_PASSWORD || 'llmpassword',
  database: process.env.POSTGRES_DB || 'llmworkflow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
});

export default pool;
