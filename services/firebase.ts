
import { initializeApp, FirebaseApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  Auth
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  Firestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Cek apakah konfigurasi lengkap
export const isFirebaseConfigured = !!(
  process.env.FIREBASE_API_KEY && 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_APP_ID
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase init error:", error);
  }
}

export { auth, db };

// Exporting Firebase functions for consistent usage
export { 
  onAuthStateChanged, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc 
};

export type UserStatus = 'pending' | 'approved' | 'blocked';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  status: UserStatus;
  requestedAt: number;
}

export const registerWithEmail = async (name: string, email: string, pass: string) => {
  if (!auth || !db) throw new Error("Firebase is not configured");
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    await updateProfile(user, { displayName: name });

    const newUser: UserProfile = {
      uid: user.uid,
      email: email,
      displayName: name,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      status: 'pending',
      requestedAt: Date.now()
    };
    
    await setDoc(doc(db, "users", user.uid), newUser);
    return user;
  } catch (error: any) {
    console.error("Registration Error:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase is not configured");
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const logout = () => auth && signOut(auth);
