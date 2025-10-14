import { useState } from "react";

interface Listing {
  id?: string;
  name: string;
  address: string;
  city: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

export default function HandleSubmitListing(listing: Listing) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

    const handleSubmit = () => {
        const data = {
            name,
            description,
            address,
            city,
            coordinates,
        };
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </form>
    )
}
