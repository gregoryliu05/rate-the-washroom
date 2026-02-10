export interface User {
    id: string;
    public_id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = RAW_API_URL.replace(/\/+$/, "");
const API_V1_URL = API_URL.endsWith("/api/v1") ? API_URL : `${API_URL}/api/v1`;

export async function listUsers() {
    try {
        const response = await fetch(`${API_V1_URL}/users/`);

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function syncUser(user: Omit<User, "id" | "public_id">, token: string) {
    try {
        const response = await fetch(`${API_V1_URL}/users/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getMe(token: string) {
    try {
        const response = await fetch(`${API_V1_URL}/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteUser(id: string, token: string) {
    try {
        const response = await fetch(`${API_V1_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        if (response.status === 204) return;
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateUser(id: string, updates: Partial<Omit<User, "id" | "public_id">>, token: string) {
    try {
        const response = await fetch(`${API_V1_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        if (response.status === 204) return;
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
