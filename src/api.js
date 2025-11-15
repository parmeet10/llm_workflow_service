import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import jobRoutes from './routes/jobs.js';
import workflowRoutes from './routes/workflows.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Routes
app.use('/workflow', jobRoutes);
app.use('/tools', workflowRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
