import express from 'express';
import { Queue } from 'bullmq';
import cors from 'cors';
import { 
  createJob, 
  getJob, 
  getAllJobs, 
  cancelJob,
    getAllWorkflows,
    addWorkflow,
    updateWorkflow,
    getWorkflowById,
    getWorkflowByName
} from './database.js';

const app = express();
app.use(express.json());
app.use(cors());

// Create BullMQ queue
const workflowQueue = new Queue('workflow-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

// ==================== JOB ENDPOINTS ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// POST /workflow/run - Submit a new workflow job
app.post('/workflow/run', async (req, res) => {
  try {
    const { text, workflowId } = req.body;
    
    // Validate required fields
    if (!text || !workflowId) {
      return res.status(400).json({ 
        error: 'Missing required fields: text, workflowId' 
      });
    }
      
      const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      return res.status(404).json({
        error: `Workflow with id ${workflowId} does not exist`
      });
    }

      // 🔍 Check if workflow is active
      console.log(workflow)
    if (!workflow.is_active) {
      return res.status(403).json({
        error: `Workflow "${workflow.name}" is disabled`
      });
    }
    
    // Create job in database
    const jobId = await createJob(text, workflowId);
    
    // Add job to BullMQ queue
    await workflowQueue.add('process', {
      jobId,
      inputText: text,
      workflowId
    });
    
    console.log(`✓ Job ${jobId} created and queued (workflowId: ${workflowId})`);
    
    res.json({ jobId });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /workflow/status/:jobId - Check job status
app.get('/workflow/status/:jobId', async (req, res) => {
  try {
    const job = await getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ 
      jobId: job.jobid,
      status: job.status 
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /workflow/result/:jobId - Get job result
app.get('/workflow/result/:jobId', async (req, res) => {
  try {
    const job = await getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({
      jobId: job.jobid,
      status: job.status,
      result: job.result,
      workflowId: job.workflow_id,
      inputText: job.inputtext,
      createdAt: job.createdat,
      completedAt: job.completedat
    });
  } catch (error) {
    console.error('Error getting job result:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /workflow/cancel/:jobId - Cancel a job
app.delete('/workflow/cancel/:jobId', async (req, res) => {
  try {
    const job = await cancelJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found or cannot be cancelled (already completed/failed)' 
      });
    }
    
    res.json({ 
      message: 'Job cancelled successfully',
      jobId: job.jobid,
      status: job.status
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /workflow/jobs - Get all jobs (debug endpoint)
app.get('/workflow/jobs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const jobs = await getAllJobs(limit);
    res.json({ jobs, count: jobs.length });
  } catch (error) {
    console.error('Error getting all jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WORKFLOW ENDPOINTS ====================

// GET /workflows - Get all workflows
app.get('/workflows', async (req, res) => {
  try {
    const workflows = await getAllWorkflows();
    res.json({ workflows, count: workflows.length });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /workflows - Add new workflow
app.post('/workflows', async (req, res) => {
  try {
      let { name, description, prompt_template: promptTemplate } = req.body;
      
      
     name = name.toLowerCase();
      const isActive = true;
      
    if (!name || !promptTemplate) {
      return res.status(400).json({ error: 'Missing required fields: name, promptTemplate, model' });
    }
      
    if(name.length < 3) {
      return res.status(400).json({ error: 'Workflow name must be at least 3 characters long' });
    }
      
      if (!promptTemplate.includes("{{text}}")) {
    return res.status(400).json({ error: "prompt_template must contain the placeholder {{text}}" });
  }


    // Check if workflow with the same name already exists
    const existingWorkflow = await getWorkflowByName(name);
    if (existingWorkflow) {
      return res.status(409).json({ error: `Workflow with name "${name}" already exists` });
    }

    const workflow = await addWorkflow({ name, description, promptTemplate, model:'llama3.2:1b', isActive });
    res.status(201).json({ workflow });
  } catch (error) {
    console.error('Error adding workflow:', error);
    res.status(500).json({ error: error.message });
  }
});


// PATCH /workflows/:id - Update workflow
app.patch('/workflows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, prompt_template:promptTemplate, model, isActive } = req.body;

    
    if (promptTemplate && !promptTemplate.includes("{{text}}")) {
    return res.status(400).json({ error: "prompt_template must contain the placeholder {{text}}" });
    }
      
    if(name && name.length < 3) {
      return res.status(400).json({ error: 'Workflow name must be at least 3 characters long' });
    }
      
      const updatedWorkflow = await updateWorkflow(id, { name, description, promptTemplate, model, isActive });

    if (!updatedWorkflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
      

    res.json({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ API server running on http://localhost:${PORT}`);
  console.log(`✓ Connected to Redis at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  console.log(`✓ Connected to PostgreSQL at ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
  console.log(`
Available endpoints:

Workflow Management:
  GET    /workflows              - Get all workflows
  POST   /workflows              - Add new workflow (admin)
  PATCH  /workflows/:id          - Update workflow by ID

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
