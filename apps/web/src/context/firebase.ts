import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const rawFirebaseConfig: Partial<FirebaseConfig> = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getFirebaseConfigOrThrow = (): FirebaseConfig => {
  const missingKeys = Object.entries(rawFirebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase configuration values: ${missingKeys.join(", ")}. ` +
        "Please set the corresponding environment variables."
    );
  }

  return rawFirebaseConfig as FirebaseConfig;
};

let cachedAuth: Auth | null = null;

export const getFirebaseAuth = (): Auth => {
  if (cachedAuth) return cachedAuth;

  const firebaseConfig = getFirebaseConfigOrThrow();
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  cachedAuth = getAuth(app);
  return cachedAuth;
};
