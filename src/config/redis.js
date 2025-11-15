import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../utils/constants.js';

// Create BullMQ queue for workflow jobs
export const workflowQueue = new Queue(QUEUE_NAMES.WORKFLOW, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

export default workflowQueue;
