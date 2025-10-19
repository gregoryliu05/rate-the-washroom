export interface OpeningHours {
    [day: string]: string; // Dictionary where key is day and value is opening hours
  }

export interface Location {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    lat: number;
    long: number;
    opening_hours?: OpeningHours;
    overall_rating: number;
    rating_count: number;
    distance?: number;
}

export interface Listing {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
  coordinates: { lat: number; lng: number };
}


export interface ClosestPlacesProps {
    userLocation: {
      lat: number;
      long: number;
    };
    maxDistance?: number; // in kilometers
    limit?: number;
  }

export interface MapBounds {
  min_lat: number,
  min_lon: number,
  max_lat: number,
  max_lon: number
}


export interface Coordinates{
  lat: number,
  lon: number
}
