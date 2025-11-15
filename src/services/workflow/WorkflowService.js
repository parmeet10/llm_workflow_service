import * as WorkflowModel from '../../database/models/Workflow.js';
import { logger } from '../../utils/logger.js';

// List all workflows
export async function listWorkflows() {
  try {
    return await WorkflowModel.getAllWorkflows();
  } catch (error) {
    logger.error('Error listing workflows:', error.message);
    throw error;
  }
}

// Get single workflow
export async function getWorkflow(id) {
  try {
    const workflow = await WorkflowModel.getWorkflowById(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }
    return workflow;
  } catch (error) {
    logger.error('Error getting workflow:', error.message);
    throw error;
  }
}

// Create new workflow
export async function createWorkflow(name, description, promptTemplate, model, isActive = true) {
  try {
    // Check if workflow with same name already exists
    const existing = await WorkflowModel.getWorkflowByName(name);
    if (existing) {
      throw new Error(`Workflow with name "${name}" already exists`);
    }

    return await WorkflowModel.addWorkflow(name, description, promptTemplate, model, isActive);
  } catch (error) {
    logger.error('Error creating workflow:', error.message);
    throw error;
  }
}

// Update workflow
export async function updateWorkflowById(id, updates) {
  try {
    const workflow = await WorkflowModel.updateWorkflow(id, updates);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }
    return workflow;
  } catch (error) {
    logger.error('Error updating workflow:', error.message);
    throw error;
  }
}

// Delete workflow
export async function deleteWorkflowById(id) {
  try {
    const workflow = await WorkflowModel.deleteWorkflow(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }
    return workflow;
  } catch (error) {
    logger.error('Error deleting workflow:', error.message);
    throw error;
  }
}
