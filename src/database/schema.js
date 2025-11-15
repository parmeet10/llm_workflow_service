import { pool } from '../config/database.js';
import { logger } from '../utils/logger.js';

// Initialize database schema
export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create ENUM type
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // Create workflow table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workflow (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        prompt_template TEXT NOT NULL,
        model VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        job_id VARCHAR(255) PRIMARY KEY,
        input_text TEXT NOT NULL,
        workflow_id INT NOT NULL REFERENCES workflow(id) ON DELETE CASCADE,
        status job_status NOT NULL DEFAULT 'pending',
        result TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);

    // Insert default workflows
    const defaultWorkflows = [
      {
        name: 'summarize',
        description: 'Summarize text into 2-3 concise sentences',
        prompt_template: `Summarize the following text in 2-3 concise sentences:\n\n{{text}}\n\nSummary:`,
        model: 'llama3.2:1b'
      },
      {
        name: 'sentiment',
        description: 'Analyze sentiment of text (positive, negative, neutral)',
        prompt_template: `Analyze sentiment of the following text. Respond with positive, negative, or neutral.\n\nText: {{text}}\n\nSentiment:`,
        model: 'llama3.2:1b'
      }
    ];

    for (const wf of defaultWorkflows) {
      await client.query(`
        INSERT INTO workflow (name, description, prompt_template, model)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO NOTHING
      `, [wf.name, wf.description, wf.prompt_template, wf.model]);
    }

    logger.success('Database schema initialized');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default { initDatabase };
