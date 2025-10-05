export interface Listing {
  id: string;
  name: string;
  address: string;
  city: string;
  description: string;
  coordinates: { lat: number; lng: number };
  distance?: number;
}

export interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  listingId: string;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}
