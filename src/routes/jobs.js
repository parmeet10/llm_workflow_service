import express from 'express';
import *  as JobService from '../services/job/JobService.js';
import * as WorkflowService from '../services/workflow/WorkflowService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /workflow/run - Submit a new workflow job
router.post('/run', async (req, res, next) => {
  try {
    const { text, workflowId } = req.body;

    // Validate required fields
    if (!text || !workflowId) {
      return res.status(400).json({
        error: 'Missing required fields: text, workflowId'
      });
    }

    // Validate workflowId is an integer
    if (!Number.isInteger(parseInt(workflowId))) {
      return res.status(400).json({
        error: 'workflowId must be an integer'
      });
    }
      
    // Check if workflow exists
    const workflow = await WorkflowService.getWorkflow(workflowId);

    // Check if workflow is active
    if (!workflow.is_active) {
      return res.status(403).json({
        error: `Workflow "${workflow.name}" is disabled`
      });
    }

    // Submit job
    const jobId = await JobService.submitJob(text, workflowId);

    res.json({ jobId });
  } catch (error) {
    logger.error('Error in POST /workflow/run:', error.message);
    next(error);
  }
});

// GET /workflow/status/:jobId - Check job status
router.get('/status/:jobId', async (req, res, next) => {

    const { jobId } = req.params;
    if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
    }

    try {
        const status = await JobService.getJobStatus(jobId);
        res.json(status);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        logger.error('Error in GET /workflow/status:', error.message);
        next(error);
    }
});

// GET /workflow/result/:jobId - Get job result
router.get('/result/:jobId', async (req, res, next) => {

    const { jobId } = req.params;
    if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
    }

    try {
        const result = await JobService.getJobResult(jobId);
        res.json(result);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        logger.error('Error in GET /workflow/result:', error.message);
        next(error);
    }
});

// DELETE /workflow/cancel/:jobId - Cancel a job
router.delete('/cancel/:jobId', async (req, res, next) => {

    const { jobId } = req.params;
    if (!jobId) {
        return res.status(400).json({ error: 'Missing required parameter: jobId' });
    }

    try {
        const cancelled = await JobService.cancelJobById(req.params.jobId);
        res.json({ message: 'Job cancelled successfully', ...cancelled });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        logger.error('Error in DELETE /workflow/cancel:', error.message);
        next(error);
    }
});

// GET /workflow/jobs - Get all jobs (debug endpoint)
router.get('/jobs', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const jobs = await JobService.listAllJobs(limit);
    res.json({ jobs, count: jobs.length });
  } catch (error) {
    logger.error('Error in GET /workflow/jobs:', error.message);
    next(error);
  }
});

export default router;
