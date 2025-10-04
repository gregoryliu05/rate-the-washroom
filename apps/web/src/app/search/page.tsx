'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';

interface WashroomResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  distance: string;
  amenities: string[];
  isOpen: boolean;
}

const mockResults: WashroomResult[] = [];

const StarRating = ({ rating }: { rating: number }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={i} className="text-yellow-400">⭐</span>
    );
  }

  if (hasHalfStar) {
    stars.push(
      <span key="half" className="text-yellow-400">⭐</span>
    );
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className="text-gray-300">⭐</span>
    );
  }

  return (
    <div className="flex items-center">
      <div className="flex">{stars}</div>
      <span className="ml-2 text-sm font-medium text-gray-600">({rating})</span>
    </div>
  );
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<WashroomResult[]>(mockResults);
  const [filters, setFilters] = useState({
    minRating: 0,
    wheelchairAccessible: false,
    openNow: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual search functionality
    console.log('Searching for:', searchQuery, 'in:', location);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Washrooms</h1>
          <SearchBar />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={1}>1+ Stars</option>
                    <option value={2}>2+ Stars</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.wheelchairAccessible}
                      onChange={(e) => handleFilterChange('wheelchairAccessible', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Wheelchair Accessible</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.openNow}
                      onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Open Now</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {results.length} washrooms found
              </h2>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="distance">Sort by Distance</option>
                <option value="rating">Sort by Rating</option>
                <option value="reviews">Sort by Reviews</option>
              </select>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No washrooms found</div>
                <p className="text-gray-400">
                  Try adjusting your search criteria or add a new washroom location.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((washroom) => (
                  <div key={washroom.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {washroom.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">{washroom.address}</p>
                        <div className="flex items-center space-x-4">
                          <StarRating rating={washroom.rating} />
                          <span className="text-sm text-gray-500">
                            {washroom.reviewCount} reviews
                          </span>
                          <span className="text-sm text-gray-500">
                            {washroom.distance} away
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          washroom.isOpen 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {washroom.isOpen ? 'Open' : 'Closed'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {washroom.amenities.map((amenity, index) => (
                          <span key={index} className="text-lg" title={getAmenityName(amenity)}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                      
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getAmenityName(amenity: string): string {
  const amenityNames: { [key: string]: string } = {
    '🚻': 'Restroom',
    '♿': 'Wheelchair Accessible',
    '🧻': 'Toilet Paper',
    '🧴': 'Soap',
    '🍃': 'Air Freshener',
    '🚿': 'Shower'
  };
  return amenityNames[amenity] || amenity;
}
