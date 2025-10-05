'use client';
import Navbar from './components/navbar';
import Map from './components/map';
import { useEffect } from 'react';

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
      <div id="list" className="h-32 bg-gray-100 flex justify-center items-center">
        <ul>
          <li>List items</li>
        </ul>
      </div> 
    </div>
  );
}