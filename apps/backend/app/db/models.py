from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, Float, 
    Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


class Washroom(Base):
    __tablename__ = "washrooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    
    # PostGIS geometry field for location
    geom = Column(Geometry('POINT', srid=4326), nullable=False)
    
    # Washroom details
    opening_hours = Column(JSONB, nullable=True) 

    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


    # Relationships
    creator = relationship("User")
    reviews = relationship("Review", back_populates="washroom", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="washroom", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="washroom", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    washroom_id = Column(UUID(as_uuid=True), ForeignKey("washrooms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Rating (1-5 stars)
    overall_rating = Column(Integer, nullable=False)  # 1-5

    
    # Review content
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    
    # Metadata
    likes = Column(Integer, default=0, nullable=False)  # Count of helpful votes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    washroom = relationship("Washroom", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

    # Constraints only (indexes created separately in init_db.py)
    __table_args__ = (
        UniqueConstraint('washroom_id', 'user_id', name='uq_review_washroom_user'),
    )


class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    washroom_id = Column(UUID(as_uuid=True), ForeignKey("washrooms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Photo metadata
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Storage info
    storage_path = Column(String(500), nullable=False)
    storage_provider = Column(String(50), default="local", nullable=False)  # local, s3, etc.
    
    # Photo details
    caption = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=True, nullable=False)

    # Relationships
    washroom = relationship("Washroom", back_populates="photos")
    user = relationship("User", back_populates="photos")


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    washroom_id = Column(UUID(as_uuid=True), ForeignKey("washrooms.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Report details
    report_type = Column(String(50), nullable=False)  # closed, incorrect_info, unsafe, etc.
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Status tracking
    status = Column(String(20), default="pending", nullable=False)  # pending, in_review, resolved, dismissed
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    
    # Admin fields
    admin_notes = Column(Text, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    washroom = relationship("Washroom", back_populates="reports")
    user = relationship("User", back_populates="reports")
    resolver = relationship("User", foreign_keys=[resolved_by])