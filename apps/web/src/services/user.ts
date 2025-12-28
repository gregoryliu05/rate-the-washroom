

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
}

export async function listUsers() {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        const users = await response.json();
        return users;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function createUser(user: Omit<User, 'id'>) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        const newUser = await response.json();
        return newUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getUserById(id: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`);

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        const user = await response.json();
        return user;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteUser(id: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        const deletedUser = await response.json();
        return deletedUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function updateUser(id: string, user: Partial<Omit<User, 'id'>>) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        });

        if (!response.ok) {
            throw new Error(`error: ${response.status}`);
        }

        const updatedUser = await response.json();
        return updatedUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


