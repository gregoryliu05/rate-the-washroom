

interface Listing {
  id?: string;
  name: string;
  address: string;
  city: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

interface Review {
  id?: string;
  title: string;
  content: string;
  rating: number;
  listingId: string;
  userId: string;
}

// This file is used to define the API endpoints for the application.
// It is used to make requests to the backend API.
const API_URL = 'http://localhost:8000';

export const createListing = async (listing: Listing) => {
    const response = await fetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing),
    });
    return response.json();
}

export const getListings = async () => {
    try {
        const response = await fetch(`${API_URL}/listings`);

        if (!response.ok)
            throw new Error('Failed to fetch listings');

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching listings:', error);
        throw error;
    }
}

export const createReview = async (review: Review) => {
    const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
    });
    return response.json();
}

export const getReviews = async () => {
    const response = await fetch(`${API_URL}/reviews`);
    return response.json();
}

