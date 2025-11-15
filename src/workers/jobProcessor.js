import { Worker } from 'bullmq';
import * as JobModel from '../database/models/Job.js';
import { callOllama } from '../services/llm/OllamaService.js';
import * as WorkflowModel from '../database/models/Workflow.js';
import { logger } from '../utils/logger.js';
import { QUEUE_NAMES } from '../utils/constants.js';

logger.info('Starting worker...');

// Create BullMQ worker
const worker = new Worker(QUEUE_NAMES.WORKFLOW, async (job) => {
  const { jobId, inputText, workflowId } = job.data;

  logger.info(`Processing job ${jobId} with workflowId: ${workflowId}`);

  try {
    // Update status to processing
    await JobModel.updateJobStatus(jobId, 'processing');
    logger.success(`Job ${jobId} status updated to 'processing'`);

    // Get workflow
    const workflow = await WorkflowModel.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Build prompt from template
    const prompt = workflow.prompt_template.replace('{{text}}', inputText);

    // Execute Ollama
    logger.info(`Executing Ollama for job ${jobId}`);
    const result = await callOllama(prompt);

    // Save result
    await JobModel.updateJobResult(jobId, result);
    logger.success(`Job ${jobId} completed successfully`);
    logger.info(`Result: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);

    return { success: true, jobId, result };
  } catch (error) {
    logger.error(`Job ${jobId} failed:`, error.message);

    // Save error
    await JobModel.updateJobError(jobId, error.message);

    throw error;
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000
  }
});

// Event handlers
worker.on('completed', (job) => {
  logger.success(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  logger.error('Worker error:', err.message);
});

worker.on('active', (job) => {
  logger.info(`Job ${job.id} is now active`);
});

worker.on('stalled', (jobId) => {
  logger.warn(`Job ${jobId} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, closing worker gracefully...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT received, closing worker gracefully...');
  await worker.close();
  process.exit(0);
});

logger.success('Worker started and waiting for jobs...');
logger.info(`Connected to Redis at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
logger.info('Concurrency: 5 jobs');
logger.info('Rate limit: 10 jobs per second');
