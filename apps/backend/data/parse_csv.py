#!/usr/bin/env python3
"""
CSV Parser for Vancouver Public Washroom Data
Reads CSV data into a pandas DataFrame for database population
"""

import pandas as pd
import json
import sys
import os
from pathlib import Path
from typing import Optional, List
import uuid

# Add the app directory to the Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))


def parse_geom_coordinates(geom_str: str) -> tuple[Optional[float], Optional[float]]:
    """
    Extract latitude and longitude from the Geom JSON field
    Returns (lat, lon) tuple or (None, None) if parsing fails
    """
    if not geom_str or geom_str.strip() == '':
        return None, None

    try:
        geom_data = json.loads(geom_str)
        if 'coordinates' in geom_data and len(geom_data['coordinates']) >= 2:
            lon, lat = geom_data['coordinates'][:2]  # GeoJSON format: [longitude, latitude]
            return float(lat), float(lon)
    except (json.JSONDecodeError, ValueError, KeyError):
        pass

    return None, None


def load_washroom_data(csv_file_path: str) -> pd.DataFrame:
    """
    Load Vancouver washroom data from CSV into a pandas DataFrame
    with cleaned and normalized columns for database insertion
    """
    try:
        # Read CSV with semicolon delimiter
        df = pd.read_csv(csv_file_path, delimiter=';', encoding='utf-8')

        # Clean column names (remove spaces, make lowercase)
        df.columns = df.columns.str.strip()

        # Parse coordinates from Geom field
        geom_coords = df['Geom'].apply(parse_geom_coordinates)
        df['lat'] = [coord[0] for coord in geom_coords]
        df['long'] = [coord[1] for coord in geom_coords]

        # Clean and standardize the DataFrame for database insertion
        db_df = pd.DataFrame({
            'name': df['Park Name'].fillna('Unknown').astype(str),
            'description': df['Type'].fillna('').astype(str),
            'address': df['Location'].fillna('').astype(str),
            'city': 'Vancouver',
            'country': 'Canada',
            'lat': pd.to_numeric(df['lat'], errors='coerce').astype('float64'),
            'long': pd.to_numeric(df['long'], errors='coerce').astype('float64'),
            'geom': df['Geom'].fillna('').astype(str),  # Will be converted to PostGIS Geometry
            'opening_hours': df['Summer hours'].fillna('').astype(str),  # Will be converted to JSONB
            'overall_rating': 0.0,  # Float with default
            'rating_count': 0,      # Integer with default
            'floor': None,          # Integer nullable
            'wheelchair_access': df['Wheelchair access'].fillna('').str.lower().isin(['yes', 'true', '1']).astype(bool)
        })

        # Remove rows with invalid coordinates
        db_df = db_df.dropna(subset=['lat', 'long'])

        return db_df

    except FileNotFoundError:
        print(f"Error: CSV file not found: {csv_file_path}")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return pd.DataFrame()


def print_dataframe_summary(df: pd.DataFrame):
    """
    Print a summary of the DataFrame
    """
    if df.empty:
        print("DataFrame is empty")
        return

    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")

    if 'description' in df.columns:
        print(f"Types: {df['description'].value_counts().head(5).to_dict()}")

    if 'lat' in df.columns and 'long' in df.columns:
        print(f"Lat range: {df['lat'].min():.4f} to {df['lat'].max():.4f}")
        print(f"Lon range: {df['long'].min():.4f} to {df['long'].max():.4f}")


def create_washroom_instances(df: pd.DataFrame) -> List[dict]:
    """
    Convert DataFrame to list of dictionaries that can be used to create Washroom model instances
    """
    washrooms = []

    for _, row in df.iterrows():
        # Convert geom string to proper GeoJSON format for PostGIS
        geom_json = json.loads(row['geom']) if row['geom'] else {"type": "Point", "coordinates": [0.0, 0.0]}

        # Convert opening_hours string to JSONB format
        opening_hours_json = {"hours": row['opening_hours']} if row['opening_hours'] else None

        washroom_data = {
            'id': uuid.uuid4(),
            'name': str(row['name']),
            'description': str(row['description']),
            'address': str(row['address']),
            'city': str(row['city']),
            'country': str(row['country']),
            'lat': float(row['lat']),
            'long': float(row['long']),
            'geom': geom_json,  # GeoJSON dict for PostGIS Geometry
            'opening_hours': opening_hours_json,  # Dict for JSONB
            'overall_rating': 0.0,
            'rating_count': 0,
            'floor': None,
            'wheelchair_access': bool(row['wheelchair_access']),
            'created_by': None
        }
        washrooms.append(washroom_data)

    return washrooms


def csv2Dict() -> List[dict]:
    """
    Main function to load CSV data and return list of dictionaries for database insertion
    """
    # File path
    van_public_csv_file = Path(__file__).parent / 'van-public-washroom-data.csv'
    sfu_csv_file = Path(__file__).parent / 'sfu_washrooms.csv'

    print("CSV data load into DB")
    print(f"CSV files: \n {van_public_csv_file} \n {sfu_csv_file}")

    # Load the data
    # TODO: Load and return SFU DATA
    van_public_df = load_washroom_data(str(van_public_csv_file))

    if van_public_df.empty:
        print("vancouver public csv failed to load. exiting.")
        return []

    # Print summary
    print_dataframe_summary(van_public_df)

    # Create washroom instances for database insertion
    washrooms = create_washroom_instances(van_public_df)
    print(f"Created {len(washrooms)} washroom instances ready for database insertion")

    return washrooms


def load_data_to_database():
    """
    Load CSV data directly into the database
    """
    try:
        # Import here to avoid circular imports
        from app.db.models import Washroom, Amenity
        from app.db.session import SessionLocal
        from geoalchemy2.shape import from_shape
        from shapely.geometry import Point
        
        # Get washroom data using your csv2Dict function
        washrooms_data = csv2Dict()
        
        if not washrooms_data:
            print("No washroom data to seed")
            return True
            
        # Check if database already has washroom data
        db = SessionLocal()
        try:
            existing_count = db.query(Washroom).count()
            if existing_count > 0:
                print(f"Database already has {existing_count} washrooms, skipping seed")
                return True
            
            # Get or create "Accessible" amenity
            accessible_amenity = db.query(Amenity).filter(Amenity.name == "Accessible").first()
            if not accessible_amenity:
                accessible_amenity = Amenity(name="Accessible")
                db.add(accessible_amenity)
                db.flush()  # Flush to get the ID
            
            # Insert washroom data
            inserted_count = 0
            for washroom_data in washrooms_data:
                # Extract wheelchair_access before creating washroom
                wheelchair_access = washroom_data.pop('wheelchair_access', False)
                
                # Create Point geometry from coordinates for PostGIS
                geom_data = washroom_data.pop('geom', {})
                if 'coordinates' in geom_data and len(geom_data['coordinates']) >= 2:
                    lon, lat = geom_data['coordinates'][:2]
                    point = Point(lon, lat)
                    washroom_data['geom'] = from_shape(point, srid=4326)
                
                washroom = Washroom(**washroom_data)
                db.add(washroom)
                db.flush()  # Flush to get the washroom ID
                
                # Add accessible amenity if wheelchair access is available
                if wheelchair_access:
                    washroom.amenities.append(accessible_amenity)
                
                inserted_count += 1
            
            db.commit()
            print(f"Successfully inserted {inserted_count} washroom records into database")
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Error loading data to database: {e}")
        return False


if __name__ == "__main__":
    """
    Run this script directly to load data into the database
    """
    print("🚀 Loading Vancouver washroom data into database...")
    success = load_data_to_database()
    if success:
        print("✅ Data loading completed successfully!")
        sys.exit(0)
    else:
        print("❌ Data loading failed!")
        sys.exit(1)


