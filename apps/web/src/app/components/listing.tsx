import React, { useState, useEffect, useMemo } from 'react';
import { Location, ClosestPlacesProps } from './types';
import locationsData from './locations.json';

const ClosestPlaces: React.FC<ClosestPlacesProps> = ({
  userLocation,
  maxDistance = 10,
  limit = 10
}) => {
  const [closestLocations, setClosestLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Formula to calculate distance
  const calculateDistance = (lat1: number, long1: number, lat2: number, long2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLong = (long2 - long1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLong/2) * Math.sin(dLong/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Memoized calculation of closest locations
  const sortedLocations = useMemo(() => {
    if (!userLocation) {
        userLocation = {
            lat: 49.2827,
            long: 123.1207
        };
    }

    const locationsWithDistance = (locationsData as Location[]).map(location => ({
      ...location,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.long,
        location.lat,
        location.long
      )
    }));

    return locationsWithDistance
      .filter(location => location.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }, [userLocation, maxDistance, limit]);

  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userLocation) {
        setError('User location is required');
        return;
      }

      setClosestLocations(sortedLocations);
    } catch (err) {
      setError('Failed to calculate closest locations');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, sortedLocations]);

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Render star rating
  const renderRating = (rating: number, count: number) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return (
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
        <div className="flex text-yellow-500">
          {'★'.repeat(fullStars)}
          {'☆'.repeat(emptyStars)}
        </div>
        <span className="text-xs text-gray-500">({count})</span>
      </div>
    );
  };

  // Handle card click
  const handleCardClick = (location: Location) => {
    setSelectedLocation(location);
    // You can add more logic here like:
    // - Opening a modal
    // - Navigating to a detail page
    // - Zooming to the location on the map
    console.log('Selected location:', location);
  };

  // Close detail view
  const handleCloseDetail = () => {
    setSelectedLocation(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-gray-600">
        <p>Finding closest places...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[70%]">
      {/* Main container with border and scroll */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {/* Fixed header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-300 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            Nearby Places ({closestLocations.length})
          </h2>
          <p className="text-sm text-gray-600">Within {maxDistance}km</p>
        </div>

        {/* Scrollable cards container */}
        <div className="max-h-64 overflow-y-auto"> {/* Fixed height with scrolling */}
          {closestLocations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No places found within {maxDistance}km</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {closestLocations.map((location, index) => (
                <div
                  key={location.id}
                  onClick={() => handleCardClick(location)}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:translate-y-[-1px] active:scale-[0.98]"
                >
                  {/* Header with rank, name and distance */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-800 text-sm">
                        {location.name}
                      </h3>
                    </div>
                    <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                      {formatDistance(location.distance!)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {location.description}
                  </p>

                  {/* Address */}
                  <p className="text-xs text-gray-500 mb-2">
                    {location.address}, {location.city}
                  </p>

                  {/* Rating */}
                  <div className="flex justify-between items-center">
                    {location.overall_rating && (
                      renderRating(location.overall_rating, location.rating_count)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Location Details */}
{selectedLocation && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Backdrop */}
    <div 
      className="absolute inset-0"
      onClick={handleCloseDetail}
    ></div>
    
    {/* Card content */}
    <div className="relative mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-blue-800">{selectedLocation.name}</h3>
        <button
          onClick={handleCloseDetail}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Close
        </button>
      </div>
      <p className="text-sm text-blue-700 mb-2">{selectedLocation.description}</p>
      <p className="text-xs text-blue-600 mb-2">
        {selectedLocation.address}, {selectedLocation.city}, {selectedLocation.country}
      </p>
      {selectedLocation.overall_rating && (
        <div className="mb-2">
          {renderRating(selectedLocation.overall_rating, selectedLocation.rating_count)}
        </div>
      )}
      {selectedLocation.opening_hours && (
        <div className="text-xs text-blue-600">
          <strong>Opening Hours:</strong>
          <div className="mt-1">
            {Object.entries(selectedLocation.opening_hours).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="capitalize">{day}:</span>
                <span>{hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}
</div>
);
};

export default ClosestPlaces;