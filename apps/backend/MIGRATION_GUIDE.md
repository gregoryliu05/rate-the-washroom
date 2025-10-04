# Database Migration Guide

This guide explains how to manage database migrations for the Rate the Washroom project using Alembic and Docker.

## Overview

The project uses:
- **PostgreSQL** with **PostGIS** extension for geospatial data
- **Alembic** for database migrations
- **SQLAlchemy** for ORM models
- **Docker** for consistent development environment

## Database Schema

### Core Tables

1. **users** - User accounts and authentication
2. **washrooms** - Washroom locations with PostGIS geometry
3. **reviews** - User reviews and ratings
4. **photos** - User-uploaded photos
5. **reports** - Problem reports and maintenance requests

### Key Features

- **PostGIS Integration**: Washroom locations stored as POINT geometry with SRID 4326
- **GIST Index**: Spatial index on washrooms.geom for efficient location queries
- **UUID Primary Keys**: All tables use UUID for better distributed system support
- **Audit Fields**: created_at, updated_at timestamps on all tables

## Running Migrations

### Using Docker (Recommended)

The project includes a Docker Compose setup that makes migrations consistent across all environments.

#### Initial Setup

1. **Start the database**:
   ```bash
   docker-compose up db -d
   ```

2. **Run initial migrations**:
   ```bash
   docker-compose --profile migration run --rm migrate
   ```

#### Development Workflow

1. **Start all services**:
   ```bash
   docker-compose up
   ```

2. **Create a new migration** (after model changes):
   ```bash
   docker-compose exec api alembic revision --autogenerate -m "Description of changes"
   ```

3. **Apply migrations**:
   ```bash
   docker-compose exec api alembic upgrade head
   ```

### Manual Migration Commands

If running outside Docker:

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
pip install -e .

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rate_the_washroom"

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Your migration description"

# Check migration status
alembic current
alembic history
```

## Migration Files

Migrations are stored in `apps/backend/alembic/versions/` and follow the naming convention:
- `001_initial_schema.py` - Initial database setup
- `002_add_new_feature.py` - Subsequent changes

## Configuration

### Database URL

The database connection is configured in `apps/backend/app/core/settings.py`:

```python
DATABASE_URL: str = Field(
    default="postgresql://postgres:postgres@localhost:5432/rate_the_washroom",
    env="DATABASE_URL"
)
```

### Alembic Configuration

- `alembic.ini` - Main configuration file
- `alembic/env.py` - Environment setup with model imports
- `alembic/versions/` - Migration files directory

## PostGIS Setup

The PostGIS extension is automatically enabled in the initial migration:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Spatial Index

A GIST index is created on the washrooms geometry column for efficient spatial queries:

```sql
CREATE INDEX idx_washrooms_geom ON washrooms USING GIST (geom);
```

## Best Practices

### 1. Always Test Migrations

Before deploying to production:

```bash
# Test on a copy of production data
docker-compose --profile migration run --rm migrate
```

### 2. Use Descriptive Migration Names

```bash
alembic revision --autogenerate -m "Add user profile picture field"
```

### 3. Review Generated Migrations

Always review auto-generated migrations before applying:

```bash
# Check what will be changed
alembic upgrade head --sql
```

### 4. Backup Before Major Changes

```bash
# Backup database
docker-compose exec db pg_dump -U postgres rate_the_washroom > backup.sql
```

## Troubleshooting

### Common Issues

1. **Migration conflicts**: Resolve by editing the conflicting migration file
2. **PostGIS not found**: Ensure PostGIS extension is installed in PostgreSQL
3. **Permission errors**: Check database user permissions

### Reset Database

To completely reset the database:

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Restart and migrate
docker-compose up db -d
docker-compose --profile migration run --rm migrate
```

## Production Deployment

For production deployments:

1. **Set production DATABASE_URL**
2. **Run migrations during deployment**
3. **Monitor migration logs**
4. **Have rollback plan ready**

```bash
# Production migration command
docker run --rm -e DATABASE_URL=$PROD_DATABASE_URL your-app-image alembic upgrade head
```

## Files Structure

```
apps/backend/
├── alembic/
│   ├── env.py                 # Alembic environment configuration
│   ├── alembic.ini           # Alembic settings
│   └── versions/
│       └── 001_initial_schema.py  # Initial migration
├── app/
│   ├── db/
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── session.py        # Database session
│   │   └── init_postgis.sql  # PostGIS initialization
│   └── core/
│       └── settings.py       # Application settings
├── scripts/
│   └── migrate.sh           # Migration script
├── Dockerfile               # Container configuration
└── pyproject.toml          # Python dependencies
```

This setup ensures that all team members can run migrations consistently through Docker, maintaining schema consistency across development, staging, and production environments.
