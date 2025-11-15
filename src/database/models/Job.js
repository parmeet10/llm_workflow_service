import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

// Create a new job
export const createJob = async (inputText, workflowId) => {
  const jobId = uuidv4();
  const createdAt = new Date().toISOString();

  const query = `
    INSERT INTO jobs (job_id, input_text, workflow_id, status, created_at)
    VALUES ($1, $2, $3, 'pending', $4)
    RETURNING job_id
  `;

  try {
    const result = await pool.query(query, [jobId, inputText, workflowId, createdAt]);
    return result.rows[0].job_id;
  } catch (error) {
    logger.error('Error creating job:', error);
    throw error;
  }
};

// Get job by ID
export const getJob = async (jobId) => {
  const query = `
    SELECT *
    FROM jobs
    WHERE job_id = $1
  `;
  try {
    const result = await pool.query(query, [jobId]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting job:', error);
    throw error;
  }
};

// Update job status
export const updateJobStatus = async (jobId, status) => {
  const query = `
    UPDATE jobs
    SET status = $1
    WHERE job_id = $2
  `;
  try {
    await pool.query(query, [status, jobId]);
  } catch (error) {
    logger.error('Error updating job status:', error);
    throw error;
  }
};

// Update job with result
export const updateJobResult = async (jobId, result) => {
  const completedAt = new Date().toISOString();
  const query = `
    UPDATE jobs
    SET result = $1, status = 'completed', completed_at = $2
    WHERE job_id = $3
  `;
  try {
    await pool.query(query, [result, completedAt, jobId]);
  } catch (error) {
    logger.error('Error updating job result:', error);
    throw error;
  }
};

// Update job with error
export const updateJobError = async (jobId, errorMsg) => {
  const query = `
    UPDATE jobs
    SET result = $1, status = 'failed'
    WHERE job_id = $2
  `;
  try {
    await pool.query(query, [errorMsg, jobId]);
  } catch (error) {
    logger.error('Error updating job error:', error);
    throw error;
  }
};

// Cancel a job
export const cancelJob = async (jobId) => {
  const query = `
    UPDATE jobs
    SET status = 'cancelled'
    WHERE job_id = $1 AND status IN ('pending', 'processing')
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [jobId]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error cancelling job:', error);
    throw error;
  }
};

// Get all jobs
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
    logger.error('Error getting all jobs:', error);
    throw error;
  }
};
