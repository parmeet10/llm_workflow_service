import app from './api.js';
import { initDatabase } from './database/schema.js';
import { logger } from './utils/logger.js';
import './workers/jobProcessor.js';

// Initialize database
await initDatabase();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.success(`API server running on http://localhost:${PORT}`);
  logger.info(`Connected to Redis at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  logger.info(`Connected to PostgreSQL at ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
  logger.info(`
Available endpoints:

Workflow Management:
  GET    /workflows              - Get all workflows
  GET    /workflows/:id          - Get single workflow
  POST   /workflows              - Add new workflow
  PATCH  /workflows/:id          - Update workflow
  DELETE /workflows/:id          - Delete workflow

Job Management:
  POST   /workflow/run           - Submit a new job
  GET    /workflow/status/:jobId - Check job status
  GET    /workflow/result/:jobId - Get job result
  DELETE /workflow/cancel/:jobId - Cancel a job
  GET    /workflow/jobs          - Get all jobs (debug)

Health:
  GET    /health                 - Health check
  `);
});

logger.success('Worker process started and listening for jobs...');
