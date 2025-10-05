'use client';

import Navbar from "../components/navbar";
import { useState } from "react";

function AddListing() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const listingData = {
            name,
            description,
            address,
            city,
            coordinates: { lat: 0, lng: 0 } // TODO: Get from map
        };
        console.log('Submitting listing:', listingData);
        // TODO: Call API to create listing
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="text-center py-4">
                <h1 className="text-2xl font-bold">Add Listing</h1>
            </div>
            <div id="navbar" className="py-4 w-full h-full flex justify-center items-center">
                <Navbar />
            </div>
            <main className="flex-1 pt-8">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-2/3 max-w-2xl mx-auto px-4">
                    <input 
                        type="text" 
                        placeholder="Name of Washroom" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Description of Washroom" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Address" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="City" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        required
                    />
                    <div className="flex space-x-4 w-full">
                        <button 
                            type="submit" 
                            className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                        >
                            Add Listing
                        </button>
                        <button 
                            type="button" 
                            className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}

export default AddListing;
