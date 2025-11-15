// Job statuses
export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Queue names
export const QUEUE_NAMES = {
  WORKFLOW: 'workflow-queue'
};

// API routes
export const ROUTES = {
  HEALTH: '/health',
  JOBS: {
    RUN: '/workflow/run',
    STATUS: '/workflow/status/:jobId',
    RESULT: '/workflow/result/:jobId',
    CANCEL: '/workflow/cancel/:jobId',
    LIST: '/workflow/jobs'
  },
  WORKFLOWS: {
    LIST: '/workflows',
    GET_ONE: '/workflows/:id',
    CREATE: '/workflows',
    UPDATE: '/workflows/:id',
    DELETE: '/workflows/:id'
  }
};
