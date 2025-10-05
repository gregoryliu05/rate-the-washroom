'use client';
import ClosestPlaces from './components/listing';
import Navbar from './components/navbar';
import Map from './components/map';
import { useEffect } from 'react';

const userLocation = {
  lat: 40.7589, // Example: Times Square area in NYC
  long: -73.9851
};

export default function Home() {
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
        <ClosestPlaces 
        userLocation={userLocation}
        maxDistance={10000}   // 5km radius
        limit={25}         // Show top 8 closest places
      />
      </div> 
    </div>
  );
}