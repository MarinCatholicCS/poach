import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signOut() {
  return firebaseSignOut(auth)
}

export interface PitchData {
  product: string
  transcript: string
  duration: 30 | 60
  poachRating: number
  capitalCommitted: number
  verdictSplit: { invest: number; pass: number; maybe: number }
  coaching: { landed: string; cut: string; reframe: string }
}

export async function savePitch(uid: string, pitchData: PitchData) {
  const ref = collection(db, 'users', uid, 'pitches')
  return addDoc(ref, { ...pitchData, createdAt: serverTimestamp() })
}

export interface SavedPitch extends PitchData {
  id: string
  createdAt: { seconds: number; nanoseconds: number } | null
}

export async function getPitches(uid: string): Promise<SavedPitch[]> {
  const ref = collection(db, 'users', uid, 'pitches')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<SavedPitch, 'id'>),
  }))
}
