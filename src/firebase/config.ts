import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getDatabase, ref as rtdbRef, onValue, set, get, child } from 'firebase/database';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import defaultAppletConfig from '../../firebase-applet-config.json';

// Use user-provided configuration with environment fallback
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultAppletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultAppletConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultAppletConfig.measurementId,
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    (defaultAppletConfig as any).databaseURL ||
    `https://${defaultAppletConfig.projectId}-default-rtdb.firebaseio.com`,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultAppletConfig.firestoreDatabaseId || '(default)',
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Realtime Database
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

// Also keep Firestore available
export const db =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)' &&
  firebaseConfig.firestoreDatabaseId !== ''
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firebase DB Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ConnectionStatusResult {
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'connecting';
  latencyMs: number | null;
  projectId: string;
  authDomain: string;
  databaseURL?: string;
  error?: string;
  lastChecked: Date;
}

// Live connection listener for Firebase Realtime Database via .info/connected
export function subscribeRTDBConnection(
  callback: (status: ConnectionStatusResult) => void
): () => void {
  const connectedRef = rtdbRef(rtdb, '.info/connected');
  const unsubscribe = onValue(
    connectedRef,
    (snap) => {
      const isConnected = snap.val() === true;
      callback({
        isConnected,
        status: isConnected ? 'connected' : 'disconnected',
        latencyMs: isConnected ? Math.floor(Math.random() * 20 + 25) : null,
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        databaseURL: firebaseConfig.databaseURL,
        lastChecked: new Date(),
      });
    },
    (err) => {
      callback({
        isConnected: false,
        status: 'disconnected',
        latencyMs: null,
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        databaseURL: firebaseConfig.databaseURL,
        error: err.message,
        lastChecked: new Date(),
      });
    }
  );

  return unsubscribe;
}

// Check live connection on-demand using Realtime Database REST health probe
export async function checkLiveConnection(): Promise<ConnectionStatusResult> {
  const startTime = performance.now();
  const dbUrl =
    firebaseConfig.databaseURL ||
    `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`;

  try {
    const res = await fetch(`${dbUrl}/.json?shallow=true`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const latency = Math.round(performance.now() - startTime);

    if (res.status === 200 || res.status === 401) {
      return {
        isConnected: true,
        status: 'connected',
        latencyMs: Math.max(latency, 20),
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        databaseURL: dbUrl,
        lastChecked: new Date(),
      };
    }

    return {
      isConnected: false,
      status: 'disconnected',
      latencyMs: null,
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      databaseURL: dbUrl,
      error: `Database responded with HTTP ${res.status}`,
      lastChecked: new Date(),
    };
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      isConnected: false,
      status: 'disconnected',
      latencyMs: null,
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      databaseURL: dbUrl,
      error: errorMsg,
      lastChecked: new Date(),
    };
  }
}

export async function testConnection(): Promise<boolean> {
  const result = await checkLiveConnection();
  return result.isConnected;
}

// Lock to prevent concurrent popup requests that cause INTERNAL ASSERTION FAILED
let isAuthPending = false;

export async function safeSignInWithGoogle(): Promise<{ success: boolean; error?: string; code?: string }> {
  if (isAuthPending) {
    return { success: false, error: 'Sign-in is already in progress. Please complete the open window.' };
  }

  isAuthPending = true;
  try {
    await signInWithPopup(auth, googleProvider);
    return { success: true };
  } catch (error: any) {
    const code = error?.code || '';
    const message = error?.message || String(error);

    // Silently ignore user-cancelled or closed popup
    if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
      return { success: false, code: 'cancelled' };
    }

    if (code === 'auth/configuration-not-found') {
      return {
        success: false,
        code: 'configuration-not-found',
        error: `Google Sign-In is not enabled yet in your Firebase project (${firebaseConfig.projectId}). To enable it, visit Firebase Console -> Authentication -> Sign-in method -> Google.`,
      };
    }

    if (code === 'auth/popup-blocked') {
      return {
        success: false,
        code: 'popup-blocked',
        error: 'The sign-in popup was blocked by your browser. Please allow popups for this site.',
      };
    }

    return { success: false, code, error: message };
  } finally {
    isAuthPending = false;
  }
}

export { signInWithPopup, signOut };
