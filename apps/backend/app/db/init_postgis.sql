-- PostGIS initialization script
-- This script sets up PostGIS extension and initial configuration

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable PostGIS Topology extension (optional, for advanced geospatial operations)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create a spatial reference system if needed (usually not necessary as EPSG:4326 is built-in)
-- Uncomment the following if you need a custom SRS:
-- INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) 
-- VALUES (9999, 'custom', 9999, '+proj=longlat +datum=WGS84 +no_defs', 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]');

-- Verify PostGIS installation
SELECT PostGIS_Version();
