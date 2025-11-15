import { pool } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

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
    logger.error('Error getting workflows:', error);
    throw error;
  }
};

// Get workflow by ID
export const getWorkflowById = async (id) => {
  const query = `
    SELECT *
    FROM workflow
    WHERE id = $1
  `;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting workflow by ID:', error);
    throw error;
  }
};

// Get workflow by name
export const getWorkflowByName = async (name) => {
  const query = `
    SELECT *
    FROM workflow
    WHERE name = $1
  `;
  try {
    const result = await pool.query(query, [name]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting workflow by name:', error);
    throw error;
  }
};

// Add new workflow
export const addWorkflow = async (name, description, promptTemplate, model, isActive = true) => {
  const query = `
    INSERT INTO workflow (name, description, prompt_template, model, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [
      name,
      description,
      promptTemplate,
      model,
      isActive
    ]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding workflow:', error);
    throw error;
  }
};

// Update workflow
export const updateWorkflow = async (id, { name, description, promptTemplate, model, isActive }) => {
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
      promptTemplate,
      model,
      isActive
    ]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating workflow:', error);
    throw error;
  }
};

// Delete workflow
export const deleteWorkflow = async (id) => {
  const query = `
    DELETE FROM workflow
    WHERE id = $1
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    logger.error('Error deleting workflow:', error);
    throw error;
  }
};
