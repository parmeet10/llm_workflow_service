import * as JobModel from '../../database/models/Job.js';
import { workflowQueue } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';

// Submit a new job to the queue
export async function submitJob(inputText, workflowId) {
  try {
    // Create job in database
    const jobId = await JobModel.createJob(inputText, workflowId);

    // Add job to BullMQ queue
    await workflowQueue.add('process', {
      jobId,
      inputText,
      workflowId
    });

    logger.success(`Job ${jobId} created and queued`);
    return jobId;
  } catch (error) {
    logger.error('Error submitting job:', error.message);
    throw error;
  }
}

// Get job status
export async function getJobStatus(jobId) {
  try {
    const job = await JobModel.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return { jobId: job.job_id, status: job.status };
  } catch (error) {
    logger.error('Error getting job status:', error.message);
    throw error;
  }
}

// Get job result
export async function getJobResult(jobId) {
  try {
    const job = await JobModel.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return {
      jobId: job.job_id,
      status: job.status,
      result: job.result,
      workflowId: job.workflow_id,
      inputText: job.input_text,
      createdAt: job.created_at,
      completedAt: job.completed_at
    };
  } catch (error) {
    logger.error('Error getting job result:', error.message);
    throw error;
  }
}

// Cancel job
export async function cancelJobById(jobId) {
  try {
    const job = await JobModel.cancelJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found or cannot be cancelled`);
    }
    return { jobId: job.job_id, status: job.status };
  } catch (error) {
    logger.error('Error cancelling job:', error.message);
    throw error;
  }
}

// Get all jobs
export async function listAllJobs(limit = 100) {
  try {
    return await JobModel.getAllJobs(limit);
  } catch (error) {
    logger.error('Error listing jobs:', error.message);
    throw error;
  }
}
