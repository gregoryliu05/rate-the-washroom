'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth'
import { auth } from './firebase'

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider( {children}: {children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!alive) return;
            setLoading(true);
            setUser(firebaseUser);
            if (firebaseUser) {
                await syncUserWithBackend(firebaseUser);
            }
            if (alive) setLoading(false);
        });

        return () => {
            alive = false;
            unsubscribe();
        };
    }, [])

    const syncUserWithBackend = async (firebaseUser: User) => {
        try {
            const token = await firebaseUser.getIdToken()
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const normalizedApiBase = apiBaseUrl.replace(/\/+$/, "");
            const apiV1Base = normalizedApiBase.endsWith("/api/v1")
              ? normalizedApiBase
              : `${normalizedApiBase}/api/v1`;

            const email = firebaseUser.email || `${firebaseUser.uid}@users.local`;
            const usernameBase =
                firebaseUser.displayName ||
                (email.includes("@") ? email.split("@")[0] : email) ||
                "user";
            const safeBase = usernameBase
                .toLowerCase()
                .replace(/[^a-z0-9_]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 36) || "user";
            const username = `${safeBase}_${firebaseUser.uid.slice(0, 8)}`.slice(0, 50);

            const response = await fetch(`${apiV1Base}/users/sync`, {
                method: "POST",
                headers:  {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    email,
                    first_name: 'User',
                    last_name: "Name",
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
            throw new Error(`Backend sync failed: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        return await response.json();
        } catch (err) {
            console.error('Backend Sync Failed:', err)
        }
    }

    const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        await createUserWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const getToken = async () => {
        return user?.getIdToken();
    };


    return (
        <AuthContext.Provider value = {{user, loading, signIn, signUp, signInWithGoogle, signOut, getToken}}>
          {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
