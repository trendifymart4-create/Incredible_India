import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { getCurrentUserProfile, UserProfile } from '../api/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  setCurrentUserManually: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.log('AuthContext: useEffect triggered');
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      console.log('AuthContext: onAuthStateChanged triggered', { user });
      if (user) {
        const userProfile = await getCurrentUserProfile();
        console.log('AuthContext: userProfile fetched', { userProfile });
        setCurrentUser(userProfile);
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
      }
      console.log('AuthContext: setting loading to false');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setCurrentUserManually = (user: UserProfile | null) => {
    setCurrentUser(user);
    setIsAdmin(user?.isAdmin || false);
  };

  const value = {
    currentUser,
    loading,
    isAdmin,
    setCurrentUserManually,
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