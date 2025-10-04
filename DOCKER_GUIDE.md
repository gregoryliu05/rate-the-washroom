# Docker Setup Guide

This guide explains how to use the Docker setup for the Rate the Washroom project, including both frontend and backend services.

## Overview

The project uses Docker Compose to orchestrate multiple services:

- **PostgreSQL** with PostGIS (Database)
- **Redis** (Caching and sessions)
- **Backend API** (FastAPI with Python)
- **Frontend** (Next.js with React)
- **Migration Service** (Database migrations)

## Quick Start

### Development Mode (Recommended)

1. **Start all services in development mode**:
   ```bash
   docker-compose up
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432

### Production Mode

1. **Build and start production services**:
   ```bash
   docker-compose --profile production up
   ```

## Service Details

### Frontend (Next.js)

#### Development Mode
- **Hot reload** enabled
- **Source maps** for debugging
- **Volume mounting** for live code changes
- **Turbopack** for faster builds

#### Production Mode
- **Multi-stage build** for optimized image size
- **Standalone output** for better performance
- **Security headers** included
- **Non-root user** for security

### Backend (FastAPI)

- **Auto-reload** in development
- **PostgreSQL** connection with PostGIS
- **Redis** for caching
- **File uploads** support

### Database (PostgreSQL + PostGIS)

- **PostGIS extension** for geospatial data
- **Persistent volumes** for data
- **Health checks** for reliability
- **Initialization scripts** for setup

## Commands

### Basic Operations

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web
```

### Database Migrations

```bash
# Run migrations
docker-compose --profile migration run --rm migrate

# Create new migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec api alembic upgrade head
```

### Development Workflow

```bash
# Start only database and backend
docker-compose up db redis api

# Start frontend separately for better debugging
docker-compose up web

# Rebuild a specific service
docker-compose build web
docker-compose up web

# Execute commands in running containers
docker-compose exec web npm install
docker-compose exec api python -m pytest
```

## Virtual Environment Setup

### Local Development (without Docker)

For local development without Docker, you can set up a Python virtual environment:

#### Linux/macOS:
```bash
cd apps/backend
./setup-venv.sh dev
source venv/bin/activate
```

#### Windows:
```cmd
cd apps\backend
setup-venv.bat dev
venv\Scripts\activate.bat
```

This will create a virtual environment with all dependencies and generate a `.env` file.

### Docker Virtual Environment

The Docker setup automatically creates and uses a virtual environment at `/opt/venv` inside the container. This provides:

- **Isolation**: Dependencies are isolated from the host system
- **Security**: Non-root user execution
- **Consistency**: Same environment across all deployments
- **Reproducibility**: Locked dependency versions

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rate_the_washroom
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
DEBUG=true
```

## File Structure

```
├── docker-compose.yml          # Main orchestration file
├── apps/
│   ├── backend/
│   │   ├── Dockerfile         # Backend container
│   │   ├── pyproject.toml     # Python dependencies
│   │   └── app/               # Backend source code
│   └── web/
│       ├── Dockerfile         # Frontend container
│       ├── package.json       # Node.js dependencies
│       ├── next.config.ts     # Next.js configuration
│       ├── .dockerignore      # Docker build exclusions
│       └── src/               # Frontend source code
└── DOCKER_GUIDE.md            # This guide
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using port 3000
   netstat -tulpn | grep :3000
   
   # Use different ports
   docker-compose up -p 3001:3000
   ```

2. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Build cache issues**:
   ```bash
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Database connection issues**:
   ```bash
   # Check database health
   docker-compose exec db pg_isready -U postgres
   
   # Reset database
   docker-compose down -v
   docker-compose up db
   ```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web

# Execute shell in container
docker-compose exec web sh
docker-compose exec api bash
```

## Performance Optimization

### Development
- Use **volume mounting** for live reload
- **Turbopack** for faster builds
- **Hot reload** for instant changes

### Production
- **Multi-stage builds** for smaller images
- **Standalone output** for better performance
- **Non-root user** for security
- **Health checks** for reliability

## Security Considerations

### Production Deployment
- Change default passwords
- Use environment variables for secrets
- Enable HTTPS
- Configure firewall rules
- Regular security updates

### Development
- Don't commit `.env` files
- Use different secrets for dev/staging/prod
- Enable CORS properly
- Validate all inputs

## Scaling

### Horizontal Scaling
```bash
# Scale web service
docker-compose up --scale web=3

# Scale API service
docker-compose up --scale api=2
```

### Load Balancing
- Use Nginx or Traefik for load balancing
- Configure sticky sessions if needed
- Monitor resource usage

## Monitoring

### Health Checks
```bash
# Check service health
docker-compose ps

# Check specific service
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

### Resource Usage
```bash
# View resource usage
docker stats

# View specific container
docker stats rate-the-washroom-web-1
```

This Docker setup provides a complete development and production environment for the Rate the Washroom project with proper service orchestration, database management, and deployment capabilities.
