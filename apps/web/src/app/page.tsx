'use client';
import Navbar from './components/navbar';
import { useEffect } from 'react';

export default function Home() {
  return (
    <>
      <div id="title" className="w-full h-full flex justify-center items-center">
        <h1>Rate the Washroom</h1>
      </div>
       <div id='navbar' className="w-full h-full flex justify-center items-center">
         <Navbar />
       </div>
      <div id="map" className="w-full h-full flex justify-center items-center">Map</div>
      <div id="list" className="w-full h-full flex justify-center items-center">List</div> 
    </>
  );
}