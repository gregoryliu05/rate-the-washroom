# Simple Database Setup Guide

This guide explains the simplified database setup for the Rate the Washroom project using SQLAlchemy's automatic table creation instead of Alembic migrations.

## Overview

The project now uses:
- **PostgreSQL** with **PostGIS** extension for geospatial data
- **SQLAlchemy** ORM with automatic table creation
- **Docker** for consistent development environment
- **No migrations** - tables are created automatically at startup

## How It Works

### Automatic Table Creation

When the FastAPI backend starts up, it automatically:

1. **Enables PostGIS extension** in PostgreSQL
2. **Creates all tables** based on SQLAlchemy models
3. **Sets up indexes** for optimal performance
4. **Starts the API server**

### Database Schema

The following tables are created automatically:

- **users** - User accounts and authentication
- **washrooms** - Washroom locations with PostGIS geometry
- **reviews** - User reviews and ratings
- **photos** - User-uploaded photos
- **reports** - Problem reports and maintenance requests

## Running the Application

### Development Mode

1. **Start all services**:
   ```bash
   docker-compose up
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Mode

```bash
# Start production services
docker-compose --profile production up
```

## Database Initialization

### Automatic Setup

The database is automatically initialized when the API container starts:

```bash
# This happens automatically when you run:
docker-compose up

# You'll see output like:
# 🚀 Starting database initialization...
# 📦 Enabling PostGIS extension...
# ✅ PostGIS extension enabled
# 🏗️ Creating database tables...
# ✅ Database tables created successfully!
# 📋 Created tables: photos, reports, reviews, users, washrooms
# 🗺️ PostGIS version: 3.3.2
# 🎉 Database initialization completed successfully!
```

### Manual Initialization

If you need to initialize the database manually:

```bash
# Run the initialization script
docker-compose exec api python app/db/init_db.py
```

## Making Schema Changes

### Adding New Tables

1. **Add new models** to `app/db/models.py`
2. **Restart the API container**:
   ```bash
   docker-compose restart api
   ```

### Modifying Existing Tables

⚠️ **Warning**: SQLAlchemy's `create_all()` will NOT modify existing tables. It only creates missing tables.

For existing tables, you have two options:

#### Option 1: Drop and Recreate (Development Only)
```bash
# Stop the application
docker-compose down

# Remove the database volume
docker-compose down -v

# Start fresh
docker-compose up
```

#### Option 2: Manual SQL Changes (Production)
```sql
-- Connect to the database
docker-compose exec db psql -U postgres -d rate_the_washroom

-- Make your changes manually
ALTER TABLE users ADD COLUMN new_field VARCHAR(100);
```

## Configuration

### Database URL

The database connection is configured in `app/core/settings.py`:

```python
DATABASE_URL: str = Field(
    default="postgresql://postgres:postgres@localhost:5432/rate_the_washroom",
    env="DATABASE_URL"
)
```

### Environment Variables

For Docker, the database URL is automatically set:

```yaml
environment:
  DATABASE_URL: postgresql://postgres:postgres@db:5432/rate_the_washroom
```

## Benefits of This Approach

### ✅ Advantages

1. **Simplicity**: No migration files to manage
2. **Automatic**: Tables created on startup
3. **Fast Setup**: Team members can start immediately
4. **Less Complexity**: No Alembic configuration
5. **Good for Prototyping**: Easy to iterate on schema

### ⚠️ Limitations

1. **No Schema Evolution**: Can't modify existing tables automatically
2. **Data Loss Risk**: Dropping/recreating tables loses data
3. **Production Concerns**: Not ideal for production schema changes
4. **No Version Control**: No history of schema changes

## When to Use This Approach

### ✅ Good For

- **Development and prototyping**
- **Small teams** (1-5 developers)
- **MVP projects** where schema changes are frequent
- **Projects** where data loss is acceptable
- **Learning projects** where simplicity is valued

### ❌ Not Good For

- **Production applications** with existing data
- **Large teams** where schema coordination is needed
- **Applications** with strict data retention requirements
- **Projects** requiring complex schema evolution

## File Structure

```
apps/backend/
├── app/
│   ├── db/
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── session.py         # Database session
│   │   ├── init_db.py         # Table creation script
│   │   └── init_postgis.sql   # PostGIS setup (optional)
│   ├── core/
│   │   └── settings.py        # Application settings
│   └── main.py               # FastAPI application
├── Dockerfile                # Container configuration
├── Dockerfile.dev           # Development container
└── pyproject.toml          # Python dependencies
```

## Troubleshooting

### Common Issues

1. **Tables not created**:
   ```bash
   # Check if the init script ran
   docker-compose logs api
   
   # Run manually if needed
   docker-compose exec api python app/db/init_db.py
   ```

2. **PostGIS not available**:
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Verify PostGIS extension
   docker-compose exec db psql -U postgres -d rate_the_washroom -c "SELECT PostGIS_Version();"
   ```

3. **Permission errors**:
   ```bash
   # Check container user
   docker-compose exec api whoami
   
   # Should be 'app' user (uid 1000)
   ```

### Reset Database

To completely reset the database:

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Restart (will recreate everything)
docker-compose up
```

## Migration from Alembic

If you previously used Alembic and want to switch to this approach:

1. **Backup your data** (if needed)
2. **Remove Alembic files** (already done)
3. **Update pyproject.toml** (already done)
4. **Update docker-compose.yml** (already done)
5. **Start fresh**:
   ```bash
   docker-compose down -v
   docker-compose up
   ```

This approach provides a much simpler setup for development while maintaining all the functionality you need for the Rate the Washroom project.
