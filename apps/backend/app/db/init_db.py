#!/usr/bin/env python3
"""
Database initialization script.
Creates all tables and enables PostGIS extension.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db.models import Base
from app.core.settings import settings

def init_database():
    """Initialize database with tables and PostGIS extension"""
    try:
        print("🚀 Starting database initialization...")

        # Create engine
        engine = create_engine(settings.DATABASE_URL, echo=settings.DEBUG)

        # Enable PostGIS extension
        print("📦 Enabling PostGIS extension...")
        with engine.connect() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            connection.commit()
            print("✅ PostGIS extension enabled")

        # Create all tables
        print("🏗️  Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")

        # Create indexes manually with IF NOT EXISTS
        print("📊 Creating indexes...")
        with engine.connect() as connection:
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_washrooms_geom ON washrooms USING gist (geom);",
                "CREATE INDEX IF NOT EXISTS idx_washrooms_city ON washrooms (city);",
                "CREATE INDEX IF NOT EXISTS idx_washrooms_created_by ON washrooms (created_by);",
                "CREATE INDEX IF NOT EXISTS idx_reviews_washroom_id ON reviews (washroom_id);",
                "CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);",
                "CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating);",
                "CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at);",
                "CREATE INDEX IF NOT EXISTS idx_photos_washroom_id ON photos (washroom_id);",
                "CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos (user_id);",
                "CREATE INDEX IF NOT EXISTS idx_photos_is_approved ON photos (is_approved);",
                "CREATE INDEX IF NOT EXISTS idx_reports_washroom_id ON reports (washroom_id);",
                "CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports (user_id);",
                "CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);",
                "CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports (priority);",
                "CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at);",
            ]

            for index_sql in indexes:
                try:
                    connection.execute(text(index_sql))
                    print(f"✅ Created index: {index_sql.split()[5]}")
                except ProgrammingError as e:
                    if "already exists" in str(e):
                        print(f"ℹ️  Index already exists: {index_sql.split()[5]}")
                    else:
                        print(f"⚠️  Index creation warning: {e}")

            connection.commit()
            print("✅ All indexes processed")

        # Recompute denormalized aggregates on washrooms from reviews
        print("🧮 Recomputing washroom review aggregates...")
        with engine.connect() as connection:
            connection.execute(
                text(
                    """
                    UPDATE washrooms w
                    SET rating_count = r.cnt,
                        overall_rating = r.avg_rating
                    FROM (
                        SELECT washroom_id,
                               COUNT(*)::int AS cnt,
                               COALESCE(AVG(rating), 0)::double precision AS avg_rating
                        FROM reviews
                        GROUP BY washroom_id
                    ) r
                    WHERE w.id = r.washroom_id;
                    """
                )
            )
            connection.execute(
                text(
                    """
                    UPDATE washrooms
                    SET rating_count = 0,
                        overall_rating = 0
                    WHERE id NOT IN (SELECT DISTINCT washroom_id FROM reviews);
                    """
                )
            )
            connection.commit()
            print("✅ Washroom aggregates updated")

        # Verify tables were created
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """))

            tables = [row[0] for row in result]
            print(f"📋 Created tables: {', '.join(tables)}")

            # Check if PostGIS is working
            postgis_result = connection.execute(text("SELECT PostGIS_Version();"))
            version = postgis_result.scalar()
            print(f"🗺️  PostGIS version: {version}")

        print("🎉 Database initialization completed successfully!")
        return True

    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
