// Authentication API functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  joinDate: any;
  subscription: 'free' | 'premium';
  isAdmin: boolean;
  purchasedContent: string[];
  avatarUrl?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Sign up new user
export const signUpUser = async (userData: SignUpData): Promise<UserProfile> => {
  try {
    const { email, password, firstName, lastName, country } = userData;
    
    // Create user account
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    });
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      firstName,
      lastName,
      country,
      joinDate: serverTimestamp(),
      subscription: 'free',
      isAdmin: false,
      purchasedContent: [],
      avatarUrl: undefined
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return userProfile;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in user
export const signInUser = async (credentials: SignInData): Promise<UserProfile> => {
  try {
    const { email, password } = credentials;
    
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }
    
    return userDoc.data() as UserProfile;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

// Get current user profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data() as UserProfile;
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Check if user is admin
export const checkAdminStatus = async (user: User): Promise<boolean> => {
  try {
    const tokenResult = await user.getIdTokenResult();
    return tokenResult.claims.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Admin login with custom claims verification
export const adminSignIn = async (credentials: SignInData): Promise<UserProfile> => {
  try {
    const userProfile = await signInUser(credentials);
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Authentication failed');
    }
    
    const isAdmin = await checkAdminStatus(user);
    
    if (!isAdmin) {
      await signOutUser();
      throw new Error('Access denied. Admin privileges required.');
    }
    
    return { ...userProfile, isAdmin: true };
  } catch (error: any) {
    throw new Error(error.message || 'Admin authentication failed');
  }
};

// Set admin role (Cloud Function)
export const setAdminRole = async (email: string): Promise<void> => {
  try {
    const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
    await setAdminClaim({ email });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to set admin role');
  }
};

// Remove admin role (Cloud Function)
export const removeAdminRole = async (email: string): Promise<void> => {
  try {
    const removeAdminClaim = httpsCallable(functions, 'removeAdminClaim');
    await removeAdminClaim({ email });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove admin role');
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Check if user profile already exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile for Google Sign-In
      const nameParts = user.displayName?.split(' ') || [];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName,
        country: '',
        joinDate: serverTimestamp(),
        subscription: 'free',
        isAdmin: false,
        purchasedContent: [],
        avatarUrl: user.photoURL || undefined
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    } else {
      // Return existing user profile
      return userDoc.data() as UserProfile;
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign in with Facebook
export const signInWithFacebook = async (): Promise<UserProfile> => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Check if user profile already exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile for Facebook Sign-In
      const nameParts = user.displayName?.split(' ') || [];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName,
        lastName,
        country: '',
        joinDate: serverTimestamp(),
        subscription: 'free',
        isAdmin: false,
        purchasedContent: [],
        avatarUrl: user.photoURL || undefined
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return userProfile;
    } else {
      // Return existing user profile
      return userDoc.data() as UserProfile;
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Facebook');
  }
};