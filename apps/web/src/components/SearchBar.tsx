'use client';

import { useState } from 'react';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery, 'in:', location);
  };

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-lg">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search washrooms
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search for washrooms, businesses, or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        
        <div className="sm:w-48">
          <label htmlFor="location" className="sr-only">
            Location
          </label>
          <input
            type="text"
            id="location"
            placeholder="City or address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold"
        >
          Search
        </button>
      </div>
    </form>
  );
}
