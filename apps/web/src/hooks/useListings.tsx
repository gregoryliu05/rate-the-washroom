import { useEffect, useState } from "react";
import { fetchWashroomsInBounds, Washroom } from "../services/washrooms";

// Use the Washroom interface from the service
export const useListings = (bounds?: {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}) => {
  const [listings, setWashroomListings] = useState<Washroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use default bounds if not provided (Vancouver area as default)
        const defaultBounds = {
          minLat: 49.0,
          maxLat: 49.5,
          minLon: -123.5,
          maxLon: -122.5,
        };

        const { minLat, maxLat, minLon, maxLon } = bounds || defaultBounds;
        const data = await fetchWashroomsInBounds(minLat, maxLat, minLon, maxLon);
        setWashroomListings(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch listings"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bounds]);

  return { listings, loading, error };
};
