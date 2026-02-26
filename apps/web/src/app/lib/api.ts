// API Configuration matching your FastAPI backend

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');
const API_V1_BASE_URL = API_BASE_URL.endsWith('/api/v1')
  ? API_BASE_URL
  : `${API_BASE_URL}/api/v1`;

// ===== TYPES MATCHING YOUR BACKEND SCHEMAS =====

export interface User {
  id: string; // String, not UUID!
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Washroom {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  geom: GeoPoint | string;
  lat: number;
  long: number;
  opening_hours?: Record<string, string>;
  wheelchair_access: boolean;
  overall_rating: number;
  rating_count: number;
  created_by: string; // User ID as string
}

export interface WashroomCreate {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  geom?: GeoPoint | string;
  opening_hours?: Record<string, string>;
  wheelchair_access: boolean;
  lat: number;
  long: number;
  overall_rating?: number;
  rating_count?: number;
  created_by?: string; // Optional; backend derives from auth
}

export interface ReviewFull {
  id: string;
  washroom_id: string;
  user_id: string;
  rating: number; // 1-5
  title: string | null;
  description: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewByWashroom {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  description: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewByUser {
  id: string;
  washroom_id: string;
  rating: number;
  title: string | null;
  description: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewCreate {
  washroom_id: string;
  rating: number;
  title?: string;
  description?: string;
  user_id?: string;
}

export interface ReviewEdit {
  rating: number;
  title?: string;
  description?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

// ===== USER ENDPOINTS =====

export async function createUser(payload: UserCreate, token: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUser(userId: string): Promise<ApiResponse<User>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUsers(token: string): Promise<ApiResponse<User[]>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/users/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ===== WASHROOM ENDPOINTS =====

export async function getWashrooms(): Promise<ApiResponse<Washroom[]>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/washrooms/`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching washrooms:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getWashroomsInBounds(bounds: {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}): Promise<ApiResponse<Washroom[]>> {
  try {
    const queryParams = new URLSearchParams({
      min_lat: bounds.minLat.toString(),
      min_lon: bounds.minLon.toString(),
      max_lat: bounds.maxLat.toString(),
      max_lon: bounds.maxLon.toString(),
    });

    const response = await fetch(`${API_V1_BASE_URL}/washrooms/?${queryParams.toString()}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching washrooms in bounds:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getWashroomById(id: string): Promise<ApiResponse<Washroom>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/washrooms/${id}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching washroom:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getMyWashrooms(token: string): Promise<ApiResponse<Washroom[]>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/washrooms/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching my washrooms:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createWashroom(
  payload: WashroomCreate,
  token?: string
): Promise<ApiResponse<Washroom>> {
  try {
    const normalizedPayload: WashroomCreate = {
      ...payload,
      geom: normalizeGeom(payload.geom, payload.lat, payload.long),
    };
    
    const response = await fetch(`${API_V1_BASE_URL}/washrooms/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(normalizedPayload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error creating washroom:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateWashroom(id: string, payload: Partial<WashroomCreate>): Promise<ApiResponse<Washroom>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/washrooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error updating washroom:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteWashroom(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/washrooms/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return { data: undefined };
  } catch (error) {
    console.error('Error deleting washroom:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ===== REVIEW ENDPOINTS =====

export async function getReviewsByWashroom(washroomId: string): Promise<ApiResponse<ReviewByWashroom[]>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/reviews/washroom/${washroomId}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getReviewsByUser(userId: string, token?: string): Promise<ApiResponse<ReviewByUser[]>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/reviews/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createReview(payload: ReviewCreate, token?: string): Promise<ApiResponse<ReviewByWashroom>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/reviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }
    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.error('Error creating review:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateReview(
  reviewId: string,
  payload: ReviewEdit,
  token?: string
): Promise<ApiResponse<ReviewFull>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error updating review:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteReview(reviewId: string, token?: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_V1_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return { data: undefined };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ===== GEOLOCATION HELPERS =====

export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      }
    );
  });
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Estimate walking time (average 5 km/h)
export function estimateWalkingTime(distanceKm: number): string {
  const minutes = Math.round((distanceKm / 5) * 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Estimate driving time (average 30 km/h)
export function estimateDrivingTime(distanceKm: number): string {
  const minutes = Math.round((distanceKm / 30) * 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Create PostGIS POINT geometry string
export function createPointGeometry(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

function normalizeGeom(
  geom: WashroomCreate['geom'],
  lat: number,
  long: number
): string {
  if (!geom) {
    return createPointGeometry(lat, long);
  }

  if (typeof geom === 'string') {
    return geom;
  }

  if (geom.type === 'Point') {
    const [lng, latValue] = geom.coordinates;
    return createPointGeometry(latValue, lng);
  }

  return createPointGeometry(lat, long);
}
