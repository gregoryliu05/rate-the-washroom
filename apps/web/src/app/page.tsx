'use client';
import ClosestPlaces from './components/listing';
import Navbar from './components/navbar';
import Map from './components/map';
import { useEffect, useState } from 'react';
import { Listing } from '../types';

export default function Home() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [loading, setLoading] = useState(false);


  // Request user location
  const requestLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationPermission('granted');
        // TODO: Fetch nearby listings from API
        fetchNearbyListings(location);
        setLoading(false);
      },
      (error) => {
        console.error('Location access denied:', error);
        setLocationPermission('denied');
        setLoading(false);
      }
    );
  };

  // Function to fetch nearby listings from API
  const fetchNearbyListings = async (location: { lat: number; lng: number }) => {
    try {
      const response = await fetch(`http://localhost:8000/listings/nearby?lat=${location.lat}&lng=${location.lng}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby listings');
      }
      
      const listings = await response.json();
      setNearbyListings(listings);
    } catch (error) {
      console.error('Error fetching nearby listings:', error);
      setNearbyListings([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div id="title" className="text-center py-4">
        <h1 className="text-2xl font-bold">Rate the Washroom</h1>
      </div>
      <div id='navbar' className="py-4 flex justify-center items-center">
        <Navbar />
      </div>
      <div id="map" className="flex-1 flex justify-center items-center p-4">
        <div className="w-full max-w-4xl">
          {/* <Map /> */}
        </div>
      </div>
      <div id="list" className="h-80 bg-gray-100 flex justify-center items-center">
        {userLocation && (
          <ClosestPlaces 
            userLocation={{ lat: userLocation.lat, long: userLocation.lng }}
            maxDistance={100000}   // 10km radius
            limit={25}            // Show top 25 closest places
          />
        )}
      </div> 
    </div>
  );
}