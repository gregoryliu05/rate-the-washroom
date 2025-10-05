import { useEffect, useState } from "react";
import { fetchListings } from "../app/components/data_fetch";

interface Listing {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
  coordinates: { lat: number; lng: number };
}


export const useListings = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchListings().then(setListings).catch(setError).finally(() => setLoading(false));
    }, []);
}

export default useListings;

