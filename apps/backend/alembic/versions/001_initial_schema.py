"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable PostGIS extension
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis;')
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Create washrooms table
    op.create_table('washrooms',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=False),
        sa.Column('is_accessible', sa.Boolean(), nullable=False),
        sa.Column('has_paper_towels', sa.Boolean(), nullable=False),
        sa.Column('has_hand_dryer', sa.Boolean(), nullable=False),
        sa.Column('has_soap', sa.Boolean(), nullable=False),
        sa.Column('is_clean', sa.Boolean(), nullable=False),
        sa.Column('is_free', sa.Boolean(), nullable=False),
        sa.Column('opening_hours', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('website', sa.String(length=500), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_washrooms_city', 'washrooms', ['city'], unique=False)
    op.create_index('idx_washrooms_created_by', 'washrooms', ['created_by'], unique=False)
    op.create_index('idx_washrooms_is_active', 'washrooms', ['is_active'], unique=False)
    op.create_index('idx_washrooms_geom', 'washrooms', ['geom'], unique=False, postgresql_using='gist')
    
    # Create reviews table
    op.create_table('reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('washroom_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('overall_rating', sa.Integer(), nullable=False),
        sa.Column('cleanliness_rating', sa.Integer(), nullable=True),
        sa.Column('accessibility_rating', sa.Integer(), nullable=True),
        sa.Column('amenities_rating', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('is_helpful', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['washroom_id'], ['washrooms.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('washroom_id', 'user_id', name='uq_review_washroom_user')
    )
    op.create_index('idx_reviews_created_at', 'reviews', ['created_at'], unique=False)
    op.create_index('idx_reviews_overall_rating', 'reviews', ['overall_rating'], unique=False)
    op.create_index('idx_reviews_user_id', 'reviews', ['user_id'], unique=False)
    op.create_index('idx_reviews_washroom_id', 'reviews', ['washroom_id'], unique=False)
    
    # Create photos table
    op.create_table('photos',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('washroom_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('storage_path', sa.String(length=500), nullable=False),
        sa.Column('storage_provider', sa.String(length=50), nullable=False),
        sa.Column('caption', sa.Text(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('is_approved', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['washroom_id'], ['washrooms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_photos_created_at', 'photos', ['created_at'], unique=False)
    op.create_index('idx_photos_is_approved', 'photos', ['is_approved'], unique=False)
    op.create_index('idx_photos_user_id', 'photos', ['user_id'], unique=False)
    op.create_index('idx_photos_washroom_id', 'photos', ['washroom_id'], unique=False)
    
    # Create reports table
    op.create_table('reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('washroom_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['washroom_id'], ['washrooms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_reports_created_at', 'reports', ['created_at'], unique=False)
    op.create_index('idx_reports_priority', 'reports', ['priority'], unique=False)
    op.create_index('idx_reports_status', 'reports', ['status'], unique=False)
    op.create_index('idx_reports_user_id', 'reports', ['user_id'], unique=False)
    op.create_index('idx_reports_washroom_id', 'reports', ['washroom_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order to handle foreign key constraints
    op.drop_index('idx_reports_washroom_id', table_name='reports')
    op.drop_index('idx_reports_user_id', table_name='reports')
    op.drop_index('idx_reports_status', table_name='reports')
    op.drop_index('idx_reports_priority', table_name='reports')
    op.drop_index('idx_reports_created_at', table_name='reports')
    op.drop_table('reports')
    
    op.drop_index('idx_photos_washroom_id', table_name='photos')
    op.drop_index('idx_photos_user_id', table_name='photos')
    op.drop_index('idx_photos_is_approved', table_name='photos')
    op.drop_index('idx_photos_created_at', table_name='photos')
    op.drop_table('photos')
    
    op.drop_index('idx_reviews_washroom_id', table_name='reviews')
    op.drop_index('idx_reviews_user_id', table_name='reviews')
    op.drop_index('idx_reviews_overall_rating', table_name='reviews')
    op.drop_index('idx_reviews_created_at', table_name='reviews')
    op.drop_table('reviews')
    
    op.drop_index('idx_washrooms_geom', table_name='washrooms')
    op.drop_index('idx_washrooms_is_active', table_name='washrooms')
    op.drop_index('idx_washrooms_created_by', table_name='washrooms')
    op.drop_index('idx_washrooms_city', table_name='washrooms')
    op.drop_table('washrooms')
    
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Note: We don't drop the PostGIS extension as it might be used by other applications
