'use client';

import { useState } from 'react';

interface RatingFormData {
  location: string;
  address: string;
  overallRating: number;
  cleanliness: number;
  accessibility: number;
  amenities: string[];
  comment: string;
  anonymous: boolean;
}

const amenityOptions = [
  { id: 'toilet_paper', label: 'Toilet Paper', icon: '🧻' },
  { id: 'soap', label: 'Soap', icon: '🧴' },
  { id: 'hand_dryer', label: 'Hand Dryer', icon: '🌪️' },
  { id: 'paper_towels', label: 'Paper Towels', icon: '🧻' },
  { id: 'mirror', label: 'Mirror', icon: '🪞' },
  { id: 'baby_changing', label: 'Baby Changing Station', icon: '👶' },
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible', icon: '♿' },
  { id: 'gender_neutral', label: 'Gender Neutral', icon: '🚻' },
  { id: 'air_freshener', label: 'Air Freshener', icon: '🍃' },
  { id: 'music', label: 'Background Music', icon: '🎵' }
];

const StarInput = ({ 
  rating, 
  onRatingChange, 
  label 
}: { 
  rating: number; 
  onRatingChange: (rating: number) => void; 
  label: string;
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`text-2xl focus:outline-none ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );
};

export default function RatingForm() {
  const [formData, setFormData] = useState<RatingFormData>({
    location: '',
    address: '',
    overallRating: 0,
    cleanliness: 0,
    accessibility: 0,
    amenities: [],
    comment: '',
    anonymous: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAmenityChange = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Implement API call to submit rating
      console.log('Submitting rating:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Rating submitted successfully!');
      
      // Reset form
      setFormData({
        location: '',
        address: '',
        overallRating: 0,
        cleanliness: 0,
        accessibility: 0,
        amenities: [],
        comment: '',
        anonymous: false
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate a Washroom</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Location Details</h3>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              id="location"
              required
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Central Park Public Restroom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street address, city, state"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Ratings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Ratings</h3>
          
          <StarInput
            rating={formData.overallRating}
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, overallRating: rating }))}
            label="Overall Rating *"
          />
          
          <StarInput
            rating={formData.cleanliness}
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, cleanliness: rating }))}
            label="Cleanliness *"
          />
          
          <StarInput
            rating={formData.accessibility}
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, accessibility: rating }))}
            label="Accessibility *"
          />
        </div>

        {/* Amenities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Available Amenities</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenityOptions.map((amenity) => (
              <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity.id)}
                  onChange={() => handleAmenityChange(amenity.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">{amenity.icon}</span>
                <span className="text-sm text-gray-700">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Comments
          </label>
          <textarea
            id="comment"
            rows={4}
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your experience, tips, or any other details..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        {/* Anonymous Option */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.anonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Submit anonymously</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || formData.overallRating === 0 || formData.cleanliness === 0 || formData.accessibility === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}
