#!/usr/bin/env python3
"""
CSV Parser for Vancouver Public Washroom Data
Reads CSV data into a pandas DataFrame for database population
"""

import pandas as pd
import json
import sys
from pathlib import Path
from typing import Optional, List
import uuid


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
        df['lon'] = [coord[1] for coord in geom_coords]
        
        # Clean and standardize the DataFrame for database insertion
        db_df = pd.DataFrame({
            'name': df['Park Name'].fillna('Unknown').astype(str),
            'description': df['Type'].fillna('').astype(str),
            'address': df['Location'].fillna('').astype(str),
            'city': 'Vancouver',
            'country': 'Canada',
            'lat': pd.to_numeric(df['lat'], errors='coerce').astype('float64'),
            'long': pd.to_numeric(df['lon'], errors='coerce').astype('float64'),
            'geom': df['Geom'].fillna('').astype(str),  # Will be converted to PostGIS Geometry
            'opening_hours': df['Summer hours'].fillna('').astype(str),  # Will be converted to JSONB
            'overall_rating': 0.0,  # Float with default
            'rating_count': 0,      # Integer with default
            'floor': None,          # Integer nullable
            'wheelchair_access': df['Wheelchair access'].fillna('').str.lower().isin(['yes', 'true', '1']).astype(bool)
        })
        
        # Remove rows with invalid coordinates
        db_df = db_df.dropna(subset=['lat', 'lon'])
        
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
    
    if 'lat' in df.columns and 'lon' in df.columns:
        print(f"Lat range: {df['lat'].min():.4f} to {df['lat'].max():.4f}")
        print(f"Lon range: {df['lon'].min():.4f} to {df['lon'].max():.4f}")


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


def main():
    """
    Main function to load CSV data into DataFrame
    """
    # File path
    csv_file = Path(__file__).parent / 'van-public-washroom-data.csv'
    
    print("Vancouver Public Washroom Data Loader")
    print(f"CSV file: {csv_file}")
    
    # Load the data
    df = load_washroom_data(str(csv_file))
    
    if df.empty:
        print("No data loaded. Exiting.")
        return 1
    
    # Print summary
    print_dataframe_summary(df)
    
    # Create washroom instances for database insertion
    washrooms = create_washroom_instances(df)
    print(f"Created {len(washrooms)} washroom instances ready for database insertion")
    
    return 0


if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)