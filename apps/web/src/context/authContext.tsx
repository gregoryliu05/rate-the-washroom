'use client'

import {createContext, useContext, useEffect, useState, ReactNode} from 'react';
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
import firebase from 'firebase/app'

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
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false)
            if (firebaseUser) {
                await syncUserWithBackend(firebaseUser)
            }
        })

        return () => unsubscribe();
    }, [])

    const syncUserWithBackend = async (firebaseUser: User) => {
        try {
            const token = await firebaseUser.getIdToken()
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/sync`, {
                method: "POST",
                headers:  {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token},`
                },
                body: JSON.stringify({
                     username: firebaseUser.displayName,
                    email: firebaseUser.email,
                    first_name: 'User',
                    last_name: "Name",
                    password: firebaseUser.uid,
                })
            })

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
        // TODO
        <AuthContext.Provider value = {{user, loading, signIn, signUp, signInWithGoogle, signOut, getToken}}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}

