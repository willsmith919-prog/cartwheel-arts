/**
 * Browser-only Firebase app + Firestore. Config comes from Vite env vars (public).
 * Never add service account JSON or Stripe secret keys to this file or any client bundle.
 */
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function hasRequiredConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )
}

/**
 * Returns the default Firebase app, or null if env is not configured (e.g. local dev without .env).
 */
export function getFirebaseApp() {
  if (!hasRequiredConfig()) {
    return null
  }
  try {
    if (getApps().length > 0) {
      return getApp()
    }
    return initializeApp(firebaseConfig)
  } catch (err) {
    console.error('Firebase init failed', err)
    return null
  }
}

/** Firestore instance, or null if Firebase is not configured. */
export function getDb() {
  const app = getFirebaseApp()
  if (!app) {
    return null
  }
  try {
    return getFirestore(app)
  } catch (err) {
    console.error('getFirestore failed', err)
    return null
  }
}
