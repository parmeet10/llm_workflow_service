# LLM Workflow Service

A robust and scalable service for managing and executing LLM (Large Language Model) workflows using Node.js, Express, BullMQ, and PostgreSQL. This service provides a simple API to manage workflows, submit jobs, and monitor their execution status.

## Features

- **Workflow Management**: Create, read, update, and delete LLM workflows
- **Job Processing**: Asynchronous job processing with BullMQ and Redis
- **Scalable Architecture**: Built with microservices in mind using Docker
- **Database Integration**: PostgreSQL for persistent storage
- **LLM Integration**: Supports Ollama for local LLM inference
- **RESTful API**: Well-documented endpoints for easy integration

## Prerequisites

- Docker and Docker Compose

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
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



*This project was created by Parmeet Singh*
