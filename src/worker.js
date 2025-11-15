import { Worker } from 'bullmq';
import { updateJobStatus, updateJobResult, updateJobError } from './database.js';
import { executeMCPTool } from './mcp-tools.js';

console.log('Starting worker...');

// Create BullMQ worker
const worker = new Worker('workflow-queue', async (job) => {
  const { jobId, inputText, workflowId } = job.data;
  
  console.log(`[${new Date().toISOString()}] Processing job ${jobId} with workflowId: ${workflowId}`);
  
  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing');
    console.log(`✓ Job ${jobId} status updated to 'processing'`);
    
    // Execute MCP tool with the workflow type
    console.log(`⚙️  Executing MCP tool Id: ${workflowId}`);
    const result = await executeMCPTool(workflowId, inputText);
    
    // Save result
    await updateJobResult(jobId, result);
    console.log(`✓ Job ${jobId} completed successfully`);
    console.log(`📊 Result: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
    
    return { success: true, jobId, result };
  } catch (error) {
    console.error(`✗ Job ${jobId} failed:`, error.message);
    
    // Save error
      await updateJobError(jobId, error.message);
    
    throw error; // Re-throw to mark job as failed in BullMQ
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  },
  // Worker options
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000 // Per second
  }
});

// Event handlers
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error:`, err.message);
});

worker.on('error', (err) => {
  console.error('⚠️  Worker error:', err);
});

worker.on('active', (job) => {
  console.log(`🔄 Job ${job.id} is now active`);
});

worker.on('stalled', (jobId) => {
  console.warn(`⏸️  Job ${jobId} stalled`);
});

worker.on('progress', (job, progress) => {
  console.log(`📈 Job ${job.id} progress: ${progress}%`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker gracefully...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker gracefully...');
  await worker.close();
  process.exit(0);
});

console.log('✓ Worker started and waiting for jobs...');
console.log(`✓ Connected to Redis at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
console.log(`✓ Concurrency: 5 jobs`);
console.log(`✓ Rate limit: 10 jobs per second`);