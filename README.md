# LLM Workflow Service

A robust and scalable service for managing and executing LLM (Large Language Model) workflows using Node.js, Express, BullMQ, and PostgreSQL. This service provides a simple API to manage workflows, submit jobs, and monitor their execution status.

## Features

- **Workflow Management**: Create, read, update, and delete LLM workflows
- **Job Processing**: Asynchronous job processing with BullMQ and Redis
- **Scalable Architecture**: Built with microservices in mind using Docker
- **Database Integration**: PostgreSQL for persistent storage
- **API Documentation**: [Postman Collection](https://cloudy-meadow-851273.postman.co/workspace/My-Workspace~a24ce848-883a-40cb-886e-d130a8287003/collection/18466194-ff1eb78a-e1bd-45ab-8989-e72096782f87?action=share&creator=18466194) for easy API testing and integration
- **LLM Integration**: Supports Ollama for local LLM inference
- **RESTful API**: Well-documented endpoints for easy integration

## Prerequisites

- Docker and Docker Compose

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/parmeet10/llm_workflow_service.git
cd llm_workflow_service
```

### 2. Start Services

Start all services using Docker Compose:

```bash
docker-compose up -d --build
```

This will start the following services:
- API Server (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)
- Ollama (port 11434)

The API will be available at `http://localhost:3000`

### 3. Verify Services

Check that all services are running:

```bash
docker-compose ps
```

**Note:** If you face issues with pulling the Ollama registry, run the following command in the shell:

```bash
docker compose exec ollama ollama pull llama3.2:1b
```


### 4. Accessing Services

- **API Documentation**: `http://localhost:3000` (see API Endpoints section below)
- **PostgreSQL**: Available at `localhost:5432`
- **Redis**: Available at `localhost:6379`
- **Ollama**: Available at `http://localhost:11434`

## API Endpoints

### Tool Management
- `GET /tools` - Get all tools
- `GET /tools/:id` - Get single tool
- `POST /tools` - Add new tool
- `PATCH /tools/:id` - Update tool
- `DELETE /tools/:id` - Delete tool

### Job Management
- `POST /workflow/run` - Submit a new job
- `GET /workflow/status/:jobId` - Check job status
- `GET /workflow/result/:jobId` - Get job result
- `DELETE /workflow/cancel/:jobId` - Cancel a job
- `GET /workflow/jobs` - Get all jobs (debug)

### Health
- `GET /health` - Health check

## Project Structure

```
src/
  ├── api.js                  # Express app setup and routes
  ├── server.js               # Server entry point
  │
  ├── config/                 # Configuration files
  │   ├── database.js         # Database configuration
  │   └── redis.js            # Redis/BullMQ configuration
  │
  ├── database/               # Database related code
  │   ├── models/             # Sequelize models
  │   └── schema.js           # Database schema and migrations
  │
  ├── middleware/             # Express middleware
  │   ├── errorHandler.js
  │   └── logger.js
  │
  ├── routes/                 # API route handlers
  │   ├── jobs.js
  │   └── workflows.js
  │
  ├── services/               # Business logic
  │   ├── job/
  │   ├── llm/
  │   └── workflow/
  │
  ├── utils/                  # Utility functions
  │   ├── constants.js
  │   └── logger.js
  │
  └── workers/                # Background job processors
      └── jobProcessor.js
```

## Deployment

The application is containerized using Docker. To deploy:

1. Build the Docker image:
   ```bash
   docker-compose build
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port for the API server | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `POSTGRES_*` | PostgreSQL connection details | See .env.example |
| `REDIS_*` | Redis connection details | See .env.example |
| `OLLAMA_BASE_URL` | URL for Ollama service | `http://ollama:11434` |



## API Examples

### Get All Tools

```bash
curl --location 'http://localhost:3000/tools'
```

**Response:**

```json
{
    "workflows": [
        {
            "id": 2,
            "name": "sentiment",
            "description": "Analyze sentiment of text (positive, negative, neutral)",
            "prompt_template": "Analyze sentiment of the following text. Respond with positive, negative, or neutral.\n\nText: {{text}}\n\nSentiment:",
            "model": "llama3.2:1b",
            "is_active": true,
            "created_at": "2025-11-15T22:57:03.926Z"
        },
        {
            "id": 1,
            "name": "summarize",
            "description": "Summarize text into 2-3 concise sentences",
            "prompt_template": "Summarize the following text in 2-3 concise sentences:\n\n{{text}}\n\nSummary:",
            "model": "llama3.2:1b",
            "is_active": true,
            "created_at": "2025-11-15T22:57:03.925Z"
        }
    ],
    "count": 2
}
```

### Update a Tool

```bash
curl --location --request PATCH 'http://localhost:3000/tools/1' \
--header 'Content-Type: application/json' \
--data '{
    "name": "translate_hindi",
    "description": "Translate the given text into hindi.",
    "promptTemplate": "Translate the following text into hindi:\n\n{{text}}\n\nTranslation:"
}'
```

**Response:**

```json
{
    "workflow": {
        "id": 1,
        "name": "translate_hindi",
        "description": "Translate the given text into hindi.",
        "prompt_template": "Summarize the following text in 2-3 concise sentences:\n\n{{text}}\n\nSummary:",
        "model": "llama3.2:1b",
        "is_active": true,
        "created_at": "2025-11-15T21:51:20.212Z"
    }
}
```

### Create a New Tool

```bash
curl --location 'http://localhost:3000/tools' \
--header 'Content-Type: application/json' \
--data '{
  "name": "translate_du",
  "description": "Translate the given text into German.",
  "prompt_template": "Translate the following text into German:\n\n{{text}}\n\nTranslation:"
}'
```

**Response:**

```json
{
    "workflow": {
        "id": 21,
        "name": "translate_du",
        "description": "Translate the given text into German.",
        "prompt_template": "Translate the following text into German:\n\n{{text}}\n\nTranslation:",
        "model": "llama3.2:1b",
        "is_active": true,
        "created_at": "2025-11-15T21:45:58.068Z"
    }
}
```

### Execute a Workflow

```bash
curl --location 'http://localhost:3000/workflow/run' \
--header 'Content-Type: application/json' \
--data '{
    "text": "Parmeet is the kind of person who shows up with consistency, depth, and heart—a rare combination that's becoming increasingly hard to find.",
    "workflowId": 2
}'
```

**Response:**

```json
{
    "jobId": "30f7bf32-73d3-4fe6-9c88-7b6f02066e8e"
}
```

### Check Job Status

```bash
curl --location 'http://localhost:3000/workflow/status/30f7bf32-73d3-4fe6-9c88-7b6f02066e8e'
```

**Response:**

```json
{
    "jobId": "30f7bf32-73d3-4fe6-9c88-7b6f02066e8e",
    "status": "completed"
}
```

### Get Job Result

```bash
curl --location 'http://localhost:3000/workflow/result/30f7bf32-73d3-4fe6-9c88-7b6f02066e8e'
```

**Response:**

```json
{
    "jobId": "30f7bf32-73d3-4fe6-9c88-7b6f02066e8e",
    "status": "completed",
    "result": "The sentiment of the text is neutral. The language used is straightforward and objective, describing a characteristic (consistency, depth, and heart) without expressing a positive or negative emotion.",
    "workflowId": 2,
    "inputText": "Parmeet is the kind of person who shows up with consistency, depth, and heart—a rare combination that's becoming increasingly hard to find.",
    "createdAt": "2025-11-15T23:11:37.916Z",
    "completedAt": "2025-11-15T23:11:53.306Z"
}
```

### Get All Jobs

```bash
curl --location 'http://localhost:3000/workflow/jobs'
```

**Response:**

```json
{
    "jobs": [
        {
            "job_id": "30f7bf32-73d3-4fe6-9c88-7b6f02066e8e",
            "input_text": "Parmeet is the kind of person who shows up with consistency, depth, and heart—a rare combination that's becoming increasingly hard to find. ",
            "workflow_id": 2,
            "status": "completed",
            "result": "The sentiment of the text is neutral. The language used is straightforward and objective, describing a characteristic (consistency, depth, and heart) without expressing a positive or negative emotion.",
            "created_at": "2025-11-15T23:11:37.916Z",
            "completed_at": "2025-11-15T23:11:53.306Z"
        },
        {
            "job_id": "401418e2-ffb6-43ed-9e4e-e2f6c82d83b2",
            "input_text": "Parmeet is the kind of person who shows up with consistency, depth, and heart—a rare combination that's becoming increasingly hard to find. [truncated for brevity]",
            "workflow_id": 1,
            "status": "completed",
            "result": "Here is a 2-3 sentence summary of the text:\n\nParmeet is a rare individual who possesses consistency, depth, and heart, demonstrating a calm, grounded confidence that inspires others with his quiet discipline and steady growth. [truncated]",
            "created_at": "2025-11-15T22:59:40.648Z",
            "completed_at": "2025-11-15T22:59:54.560Z"
        },
        {
            "job_id": "1c0c2ec7-7860-450a-a1c4-6d369b8f6c1a",
            "input_text": "Parmeet is the kind of person who shows up with consistency, depth, and heart—a rare combination. [truncated]",
            "workflow_id": 1,
            "status": "completed",
            "result": "Parmeet is a person known for being consistent, genuine, hardworking, and confident. [truncated]",
            "created_at": "2025-11-15T22:57:28.152Z",
            "completed_at": "2025-11-15T22:57:43.546Z"
        }
    ],
    "count": 3
}
```

#### Canceling a Job


```bash
curl --location --request DELETE 'http://localhost:3000/workflow/cancel/68beb048-c67a-4d17-97c3-1631e7200207'
```

**Successful Response (200 OK):**
```json
{
  "message": "Job cancelled successfully",
  "id": "68beb048-c67a-4d17-97c3-1631e7200207",
  "status": "cancelled"
}
```

*This project was created by Parmeet Singh*
