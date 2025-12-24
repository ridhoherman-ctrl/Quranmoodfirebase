
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
import { UserProfile } from "../types";

const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: `${getEnv('FIREBASE_PROJECT_ID')}.firebaseapp.com`,
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: `${getEnv('FIREBASE_PROJECT_ID')}.appspot.com`,
  messagingSenderId: getEnv('FIREBASE_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

export const isFirebaseConfigured = !!(
  getEnv('FIREBASE_API_KEY') && 
  getEnv('FIREBASE_PROJECT_ID') && 
  getEnv('FIREBASE_APP_ID')
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
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, db };
export { onAuthStateChanged, onSnapshot, doc, getDoc, setDoc };

export const registerWithEmail = async (name: string, email: string, pass: string) => {
  if (!auth || !db) throw new Error("Firebase belum dikonfigurasi.");
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  await updateProfile(user, { displayName: name });
  
  const newUser: UserProfile = {
    uid: user.uid,
    email: email,
    displayName: name,
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    status: 'pending', // All new users start as pending
    requestedAt: Date.now()
  };
  await setDoc(doc(db, "users", user.uid), newUser);
  return user;
};

export const loginWithEmail = async (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase belum dikonfigurasi.");
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const logout = () => auth && signOut(auth);
