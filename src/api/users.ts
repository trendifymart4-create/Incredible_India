// Users API functions
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from './auth';

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  country?: string;
  subscription?: 'free' | 'premium';
}

export interface UserStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
}

// Get all users (admin only)
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, 'users'), orderBy('joinDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: UserProfile[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        ...doc.data()
      } as UserProfile);
    });
    
    return users;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch users');
  }
};

// Get single user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    
    if (docSnap.exists()) {
      return {
        uid: docSnap.id,
        ...docSnap.data()
      } as UserProfile;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user profile');
  }
};

// Update user profile
export const updateUserProfile = async (
  uid: string,
  data: UpdateUserProfileData
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'users', uid), updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update user profile');
  }
};

// Delete user account
export const deleteUserAccount = async (uid: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete user account');
  }
};

// Add purchased content to user
export const addPurchasedContent = async (
  uid: string,
  contentId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      purchasedContent: arrayUnion(contentId),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add purchased content');
  }
};

// Remove purchased content from user
export const removePurchasedContent = async (
  uid: string,
  contentId: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      purchasedContent: arrayRemove(contentId),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove purchased content');
  }
};

// Check if user has purchased content
export const hasPurchasedContent = async (
  uid: string,
  contentId: string
): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) return false;
    
    return userProfile.purchasedContent.includes(contentId);
  } catch (error: any) {
    console.error('Error checking purchased content:', error);
    return false;
  }
};

// Upgrade user to premium
export const upgradeUserToPremium = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: 'premium',
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upgrade user to premium');
  }
};

// Downgrade user to free
export const downgradeUserToFree = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      subscription: 'free',
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to downgrade user to free');
  }
};

// Get user statistics (admin only)
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    
    usersSnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.subscription === 'premium').length;
    const freeUsers = users.filter(u => u.subscription === 'free').length;
    
    // Calculate new users this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = users.filter(user => {
      if (user.joinDate && user.joinDate.toDate) {
        const joinDate = user.joinDate.toDate();
        return joinDate >= currentMonth;
      }
      return false;
    }).length;
    
    // For demo purposes, consider all users as active
    const activeUsers = totalUsers;
    
    return {
      totalUsers,
      premiumUsers,
      freeUsers,
      newUsersThisMonth,
      activeUsers
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user statistics');
  }
};

// Real-time listener for users (admin only)
export const subscribeToUsers = (
  callback: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, 'users'), orderBy('joinDate', 'desc'));
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const users: UserProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          uid: doc.id,
          ...doc.data()
        } as UserProfile);
      });
      
      callback(users);
    },
    (error) => {
      console.error('Error in users subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to users'));
      }
    }
  );
};

// Search users by email or name (admin only)
export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    const searchLower = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserProfile;
      const user = { uid: doc.id, ...userData };
      
      // Simple text matching
      if (
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      ) {
        users.push(user);
      }
    });
    
    return users;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search users');
  }
};