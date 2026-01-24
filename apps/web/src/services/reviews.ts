export interface Review {
    id: string;
    user_id: string;
    washroom_id: string;
    rating: number;
    title: string;
    description: string;
    likes: number;
    created_at: string;
    updated_at: string;
}

export interface CreateReviewInput {
    washroom_id: string;
    user_id: string;
    rating: number;
    title?: string;
    description?: string;
}


export interface UpdateReviewInput {
    rating: number;
    title: string;
    description: string;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = RAW_API_URL.replace(/\/+$/, "");
const API_V1_URL = API_URL.endsWith("/api/v1") ? API_URL : `${API_URL}/api/v1`;

export async function getReviewByUser(user_id: string) {
    try {
        const response = await fetch(`${API_V1_URL}/reviews/${user_id}`);
        if (!response.ok) throw new Error(`error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getReviewByWashroom(washroom_id: string) {
    try {
        const response = await fetch(`${API_V1_URL}/reviews/washroom/${washroom_id}`);
        if (!response.ok) throw new Error(`error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createReview(review: CreateReviewInput, token?: string) {
    try {
        const response = await fetch(`${API_V1_URL}/reviews/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(review),
        });
        if (!response.ok) throw new Error(`error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateReview(review_id: string, review: UpdateReviewInput, token?: string) {
    try {
        const response = await fetch(`${API_V1_URL}/reviews/${review_id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(review),
        });
        if (!response.ok) throw new Error(`error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteReview(review_id: string, token?: string) {
    try {
        const response = await fetch(`${API_V1_URL}/reviews/${review_id}`, {
            method: 'DELETE',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
        if (!response.ok) throw new Error(`error: ${response.status}`);
        if (response.status === 204) return;
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
