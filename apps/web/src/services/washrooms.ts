export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number];
}

export interface WashroomCreatePayload {
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    lat: number;
    long: number;
    geom?: string | GeoPoint;
    opening_hours?: Record<string, string>;
    wheelchair_access?: boolean;
    overall_rating: number;
    rating_count: number;
    created_by?: string;
}

export interface Washroom {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    country: string;
    lat: number;
    long: number;
    geom: GeoPoint | string;
    opening_hours?: Record<string, string>;
    wheelchair_access?: boolean;
    overall_rating: number;
    rating_count: number;
    created_by: string;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = RAW_API_URL.replace(/\/+$/, '');
const API_V1_URL = API_URL.endsWith('/api/v1') ? API_URL : `${API_URL}/api/v1`;

export const fetchWashroomsInBounds = async (
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
): Promise<Washroom[]> => {
    const response = await fetch(
        `${API_V1_URL}/washrooms/?min_lat=${minLat}&max_lat=${maxLat}&min_lon=${minLon}&max_lon=${maxLon}`
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch washrooms: ${response.status}`);
    }

    const data = await response.json();
    return data;
};

export const fetchWashroomById = async (washroomId: string): Promise<Washroom> => {
    const response = await fetch(`${API_V1_URL}/washrooms/${washroomId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch washroom: ${response.status}`);
    }

    const data = await response.json();
    return data;
};

export const createWashroom = async (
    washroom: WashroomCreatePayload,
    token?: string
): Promise<Response> => {
    // Generate geom from lat/long if not provided
    const payload = {
        ...washroom,
        geom: normalizeGeom(washroom.geom, washroom.lat, washroom.long),
    };

    const response = await fetch(`${API_V1_URL}/washrooms/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    return response;
};

const normalizeGeom = (
    geom: WashroomCreatePayload['geom'],
    lat: number,
    long: number
): string => {
    if (!geom) {
        return `POINT(${long} ${lat})`;
    }

    if (typeof geom === 'string') {
        return geom;
    }

    if (geom.type === 'Point') {
        const [lng, latValue] = geom.coordinates;
        return `POINT(${lng} ${latValue})`;
    }

    return `POINT(${long} ${lat})`;
};
