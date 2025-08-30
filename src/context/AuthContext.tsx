import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { getCurrentUserProfile, UserProfile } from '../api/auth';
import { mobileAuthManager } from '../services/mobileAuth';
import { isMobileDevice } from '../utils/deviceDetection';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  setCurrentUserManually: (user: UserProfile | null) => void;
  upgradeToPremium: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    console.log('AuthContext: useEffect triggered');
    
    // Handle mobile authentication redirect result
    const handleMobileRedirect = async () => {
      if (isMobileDevice()) {
        try {
          await mobileAuthManager.checkRedirectResult();
        } catch (error) {
          console.error('Error handling mobile auth redirect:', error);
        }
      }
    };

    handleMobileRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      console.log('AuthContext: onAuthStateChanged triggered', { user });
      if (user) {
        const userProfile = await getCurrentUserProfile();
        console.log('AuthContext: userProfile fetched', { userProfile });
        setCurrentUser(userProfile);
        setIsPremium(userProfile?.subscription === 'premium');
        if (userProfile?.isAdmin) {
          setIsAdmin(true);
        } else {
          // Check for admin custom claim
          const tokenResult = await user.getIdTokenResult();
          setIsAdmin(tokenResult.claims.admin === true);
        }
      } else {
        console.log('AuthContext: user is null, setting currentUser to null');
        setCurrentUser(null);
        setIsAdmin(false);
        setIsPremium(false);
      }
      console.log('AuthContext: setting loading to false');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setCurrentUserManually = (user: UserProfile | null) => {
    setCurrentUser(user);
    setIsAdmin(user?.isAdmin || false);
    setIsPremium(user?.subscription === 'premium');
  };

  const upgradeToPremium = async () => {
    if (currentUser) {
      try {
        // Import doc and updateDoc here to avoid circular imports
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        await updateDoc(doc(db, 'users', currentUser.uid), {
          subscription: 'premium'
        });
        
        const updatedUser = { ...currentUser, subscription: 'premium' as const };
        setCurrentUser(updatedUser);
        setIsPremium(true);
        console.log('User upgraded to premium:', updatedUser);
      } catch (error) {
        console.error('Error upgrading user to premium:', error);
        throw error;
      }
    }
  };

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      const userProfile = await getCurrentUserProfile();
      if (userProfile) {
        setCurrentUser(userProfile);
        setIsPremium(userProfile.subscription === 'premium');
        setIsAdmin(userProfile.isAdmin);
      }
    }
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    isPremium,
    setCurrentUserManually,
    upgradeToPremium,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};