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
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase';
import { isMobileDevice, isIOS, isAndroid } from '../utils/deviceDetection';

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
export const signUpUser = async (email: string, password: string, userData: Omit<SignUpData, 'email' | 'password'>): Promise<UserProfile> => {
  try {
    const { firstName, lastName, country } = userData;
    
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
export const signInUser = async (email: string, password: string): Promise<UserProfile> => {
  try {
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
export const adminSignIn = async (email: string, password: string): Promise<UserProfile> => {
  try {
    const userProfile = await signInUser(email, password);
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

// Enhanced mobile-specific Google sign-in
export const signInWithGoogleMobile = async (): Promise<UserProfile> => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Configure provider for mobile
    provider.addScope('email');
    provider.addScope('profile');
    
    // For mobile devices, use redirect method to trigger native auth
    if (isMobileDevice()) {
      // Use redirect for mobile to trigger native app authentication
      await signInWithRedirect(auth, provider);
      
      // The result will be handled by getRedirectResult in a separate function
      return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            unsubscribe();
            try {
              const profile = await handleSocialAuthUser(user);
              resolve(profile);
            } catch (error) {
              reject(error);
            }
          }
        });
      });
    } else {
      // Use popup for desktop
      return await signInWithGoogle();
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Enhanced mobile-specific Facebook sign-in
export const signInWithFacebookMobile = async (): Promise<UserProfile> => {
  try {
    const provider = new FacebookAuthProvider();
    
    // Configure provider for mobile
    provider.addScope('email');
    provider.addScope('public_profile');
    
    // For mobile devices, use redirect method to trigger native auth
    if (isMobileDevice()) {
      // Use redirect for mobile to trigger native app authentication
      await signInWithRedirect(auth, provider);
      
      // The result will be handled by getRedirectResult in a separate function
      return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            unsubscribe();
            try {
              const profile = await handleSocialAuthUser(user);
              resolve(profile);
            } catch (error) {
              reject(error);
            }
          }
        });
      });
    } else {
      // Use popup for desktop
      return await signInWithFacebook();
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Facebook');
  }
};

// Handle redirect result for mobile authentication
export const handleAuthRedirectResult = async (): Promise<UserProfile | null> => {
  try {
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      return await handleSocialAuthUser(result.user);
    }
    
    return null;
  } catch (error: any) {
    console.error('Error handling auth redirect:', error);
    throw new Error(error.message || 'Failed to handle authentication redirect');
  }
};

// Helper function to handle social auth user creation/retrieval (exported)
export const handleSocialAuthUser = async (user: User): Promise<UserProfile> => {
  // Check if user profile already exists
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  
  if (!userDoc.exists()) {
    // Create new user profile for social sign-in
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
};

// Original desktop Google sign-in (using popup)
export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    return await handleSocialAuthUser(user);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Original desktop Facebook sign-in (using popup)
export const signInWithFacebook = async (): Promise<UserProfile> => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    return await handleSocialAuthUser(user);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Facebook');
  }
};