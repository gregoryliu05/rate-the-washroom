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
    title: string;
    description: string;
}

export interface UpdateReviewInput {
    rating: number;
    title: string;
    description: string;
}

export async function getReviewByUser(user_id: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/user/${user_id}`);
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/washroom/${washroom_id}`);
        if (!response.ok) throw new Error(`error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createReview(review: CreateReviewInput) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

export async function updateReview(review_id: string, review: UpdateReviewInput) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${review_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
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

export async function deleteReview(review_id: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${review_id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error(`error: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
