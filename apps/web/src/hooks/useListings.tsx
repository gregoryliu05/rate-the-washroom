import { useEffect, useState } from "react";
import { fetchWashroomsInBounds } from "../services/api";

interface WashroomListing {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  geom: string;
  lat: number;
  long: number;
  opening_hours: { [key: string]: any };
  wheelchair_access: boolean;
  overall_rating: number;
  rating_count: number;
  created_by: string;
}


export const useListings = () => {
  const [listings, setWashroomListings] = useState<WashroomListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWashroomsInBounds().then(setWashroomListings).catch(setError).finally(() => setLoading(false));
  }, []);

  return { listings, loading, error };
}


