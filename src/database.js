import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'llmuser',
  password: process.env.POSTGRES_PASSWORD || 'llmpassword',
  database: process.env.POSTGRES_DB || 'llmworkflow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ==================== INIT DATABASE ====================
async function initDatabase() {
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

    // ---------------- WORKFLOW TABLE ----------------
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

    // ---------------- JOBS TABLE ----------------
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

    // ---------------- DEFAULT WORKFLOWS ----------------
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

    console.log("✓ Database schema initialized");

  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

initDatabase().catch(console.error);



// ==================== JOB FUNCTIONS ====================

// Create job
export const createJob = async (input_text, workflow_id) => {
  const job_id = uuidv4();
  const created_at = new Date().toISOString();

  const query = `
    INSERT INTO jobs (job_id, input_text, workflow_id, status, created_at)
    VALUES ($1, $2, $3, 'pending', $4)
    RETURNING job_id
  `;

  try {
    const result = await pool.query(query, [job_id, input_text, workflow_id, created_at]);
    return result.rows[0].job_id;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

// Get job
export const getJob = async (job_id) => {
  const query = `
    SELECT *
    FROM jobs
    WHERE job_id = $1
  `;
  try {
    const result = await pool.query(query, [job_id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting job:', error);
    throw error;
  }
};

// Update job status
export const updateJobStatus = async (job_id, status) => {
  const query = `
    UPDATE jobs
    SET status = $1
    WHERE job_id = $2
  `;
  try {
    await pool.query(query, [status, job_id]);
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
};

// Job result
export const updateJobResult = async (job_id, result) => {
  const completed_at = new Date().toISOString();
  const query = `
    UPDATE jobs
    SET result = $1, status = 'completed', completed_at = $2
    WHERE job_id = $3
  `;
  try {
    await pool.query(query, [result, completed_at, job_id]);
  } catch (error) {
    console.error('Error updating job result:', error);
    throw error;
  }
};

// Job error
export const updateJobError = async (job_id, error_msg) => {
  const query = `
    UPDATE jobs
    SET result = $1, status = 'failed'
    WHERE job_id = $2
  `;
  try {
    await pool.query(query, [error_msg, job_id]);
  } catch (error) {
    console.error('Error updating job error:', error);
    throw error;
  }
};

// Cancel job
export const cancelJob = async (job_id) => {
  const query = `
    UPDATE jobs
    SET status = 'cancelled'
    WHERE job_id = $1 AND status IN ('pending', 'processing')
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [job_id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error cancelling job:', error);
    throw error;
  }
};

// List jobs
export const getAllJobs = async (limit = 100) => {
  const query = `
    SELECT *
    FROM jobs
    ORDER BY created_at DESC
    LIMIT $1
  `;
  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error getting jobs:', error);
    throw error;
  }
};



// ==================== WORKFLOW FUNCTIONS ====================

// Get all workflows
export const getAllWorkflows = async () => {
  const query = `
    SELECT id, name, description, prompt_template, model, is_active, created_at
    FROM workflow
    ORDER BY created_at DESC
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting workflows:', error);
    throw error;
  }
};

// Get workflow by name
export const getWorkflowByName = async (name) => {
  const query = `
    SELECT *
    FROM workflow
    WHERE name = $1
    LIMIT 1
  `;
  try {
    const result = await pool.query(query, [name]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting workflow by name:', error);
    throw error;
  }
};

// Get workflow by ID
export const getWorkflowById = async (id) => {
  const query = `
    SELECT *
    FROM workflow
    WHERE id = $1
    LIMIT 1
  `;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting workflow by ID:', error);
    throw error;
  }
};

// Add workflow
export const addWorkflow = async ({ name, description, promptTemplate, model, is_active = true }) => {
    const query = `
    INSERT INTO workflow (name, description, prompt_template, model, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [
      name, description, promptTemplate, model, is_active
    ]);
    return result.rows[0];
  } catch (error) {
    console.error('Error adding workflow:', error);
    throw error;
  }
};

// Update workflow
export const updateWorkflow = async (
  id,
  { name, description, prompt_template, model, is_active }
) => {
  const query = `
    UPDATE workflow
    SET 
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      prompt_template = COALESCE($4, prompt_template),
      model = COALESCE($5, model),
      is_active = COALESCE($6, is_active)
    WHERE id = $1
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [
      id,
      name,
      description,
      prompt_template,
      model,
      is_active
    ]);
    return result.rows[0];
  } catch (error) {
    console.error('Error updating workflow:', error);
    throw error;
  }
};


// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log("Closing database pool...");
  await pool.end();
});

export default pool;
