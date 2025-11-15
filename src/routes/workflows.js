import express from 'express';
import * as WorkflowService from '../services/workflow/WorkflowService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /workflows - Get all workflows
router.get('/', async (req, res, next) => {
  try {
    const workflows = await WorkflowService.listWorkflows();
    res.json({ workflows, count: workflows.length });
  } catch (error) {
    logger.error('Error in GET /workflows:', error.message);
    next(error);
  }
});

// GET /workflows/:id - Get single workflow
router.get('/:id', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.getWorkflow(req.params.id);
    res.json({ workflow });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Error in GET /workflows/:id:', error.message);
    next(error);
  }
});

// POST /workflows - Create new workflow
router.post('/', async (req, res, next) => {
  try {
    const { name, description, prompt_template: promptTemplate, model = 'llama3.2:1b' } = req.body;

    // Validate required fields
    if (!name || !promptTemplate) {
      return res.status(400).json({
        error: 'Missing required fields: name, prompt_template'
      });
    }

    // Validate name length
    if (name.length < 3) {
      return res.status(400).json({
        error: 'Workflow name must be at least 3 characters long'
      });
    }

    // Validate template has placeholder
    if (!promptTemplate.includes('{{text}}')) {
      return res.status(400).json({
        error: 'prompt_template must contain the placeholder {{text}}'
      });
    }

    const workflow = await WorkflowService.createWorkflow(
      name.toLowerCase(),
      description,
      promptTemplate,
      model,
      true
    );

    res.status(201).json({ workflow });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    logger.error('Error in POST /workflows:', error.message);
    next(error);
  }
});

// PATCH /workflows/:id - Update workflow
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, prompt_template: promptTemplate, model, isActive } = req.body;

    // Validate template placeholder if provided
    if (promptTemplate && !promptTemplate.includes('{{text}}')) {
      return res.status(400).json({
        error: 'prompt_template must contain the placeholder {{text}}'
      });
    }

    // Validate name length if provided
    if (name && name.length < 3) {
      return res.status(400).json({
        error: 'Workflow name must be at least 3 characters long'
      });
    }

    const workflow = await WorkflowService.updateWorkflowById(id, {
      name: name ? name.toLowerCase() : undefined,
      description,
      promptTemplate,
      model,
      isActive
    });

    res.json({ workflow });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Error in PATCH /workflows/:id:', error.message);
    next(error);
  }
});

// DELETE /workflows/:id - Delete workflow
router.delete('/:id', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.deleteWorkflowById(req.params.id);
    res.json({ message: 'Workflow deleted successfully', workflow });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Error in DELETE /workflows/:id:', error.message);
    next(error);
  }
});

export default router;
