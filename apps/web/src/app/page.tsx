'use client';
import ClosestPlaces from './components/listing';
import Navbar from './components/navbar';
import MapBoxMap from './components/map';
import { useEffect, useState } from 'react';
import { Listing } from '../types';

export default function Home() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [loading, setLoading] = useState(false);

  const hardcodelocation = {
    lat: 43,
    lon: 123
  }

  useEffect(() => {
    console.log("request ran!")
    requestLocation()
  }, [])

  // Request user location
  const requestLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // TODO: have to get the coords from the map
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const bounds = {
          min_lat: 43,
          min_lon: 84,
          max_lat: 84,
          max_lon: 84
        }

        setUserLocation(location);
        setLocationPermission('granted');
        // TODO: Fetch nearby listings from API
        setLoading(false);
      },
      (error) => {
        console.error('Location access denied:', error);
        setLocationPermission('denied');
        setLoading(false);
      }
    );
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
        {/* <div className="w-full max-w-4xl"> */}
         <MapBoxMap></MapBoxMap>
        {/* </div> */}
      </div>
      <div id="list" className="h-80 bg-gray-100 flex justify-center items-center">
        {hardcodelocation && (
          <ClosestPlaces
            userLocation={{ lat: hardcodelocation.lat, long: hardcodelocation.lon }}
            maxDistance={100000}   // 10km radius
            limit={25}            // Show top 25 closest places
          />
        )}
      </div>
    </div>
  );
}
