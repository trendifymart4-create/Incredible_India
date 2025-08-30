// Favorites API functions
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Destination } from './destinations';

export interface Favorite {
  id: string;
  userId: string;
  destinationId: string;
  destination?: Destination;
  createdAt: Timestamp;
}

export interface CreateFavoriteData {
  userId: string;
  destinationId: string;
}

// Add destination to favorites
export const addToFavorites = async (data: CreateFavoriteData): Promise<string> => {
  try {
    // Check if already favorited
    const existingFavorite = await checkIfFavorited(data.userId, data.destinationId);
    if (existingFavorite) {
      throw new Error('Destination is already in favorites');
    }

    const favoriteData = {
      ...data,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'favorites'), favoriteData);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add to favorites');
  }
};

// Remove destination from favorites
export const removeFromFavorites = async (userId: string, destinationId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('destinationId', '==', destinationId)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove from favorites');
  }
};

// Check if destination is favorited by user
export const checkIfFavorited = async (userId: string, destinationId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('destinationId', '==', destinationId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error: any) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// Get user's favorites
export const getUserFavorites = async (userId: string): Promise<Favorite[]> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const favorites: Favorite[] = [];
    
    querySnapshot.forEach((doc) => {
      favorites.push({
        id: doc.id,
        ...doc.data()
      } as Favorite);
    });
    
    return favorites;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch favorites');
  }
};

// Get user's favorites with destination details
export const getUserFavoritesWithDetails = async (userId: string): Promise<Favorite[]> => {
  try {
    const favorites = await getUserFavorites(userId);
    
    // Get destination details for each favorite
    const favoritesWithDetails = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          // Import destinations API functions
          const { getDestination } = await import('./destinations');
          const destination = await getDestination(favorite.destinationId);
          
          return {
            ...favorite,
            destination: destination || undefined
          };
        } catch (error) {
          console.error(`Error fetching destination ${favorite.destinationId}:`, error);
          return favorite;
        }
      })
    );
    
    // Filter out favorites where destination couldn't be loaded
    return favoritesWithDetails.filter(fav => fav.destination !== undefined);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch favorites with details');
  }
};

// Real-time listener for user's favorites
export const subscribeToUserFavorites = (
  userId: string,
  callback: (favorites: Favorite[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const favorites: Favorite[] = [];
      
      querySnapshot.forEach((doc) => {
        favorites.push({
          id: doc.id,
          ...doc.data()
        } as Favorite);
      });
      
      callback(favorites);
    },
    (error) => {
      console.error('Error in favorites subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to favorites'));
      }
    }
  );
};

// Toggle favorite status
export const toggleFavorite = async (userId: string, destinationId: string): Promise<boolean> => {
  try {
    const isFavorited = await checkIfFavorited(userId, destinationId);
    
    if (isFavorited) {
      await removeFromFavorites(userId, destinationId);
      return false;
    } else {
      await addToFavorites({ userId, destinationId });
      return true;
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to toggle favorite');
  }
};

// Get favorite statistics for a destination
export const getDestinationFavoriteStats = async (destinationId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('destinationId', '==', destinationId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error: any) {
    console.error('Error getting favorite stats:', error);
    return 0;
  }
};

// Get most favorited destinations
export const getMostFavoritedDestinations = async (limit: number = 10): Promise<{ destinationId: string; count: number }[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'favorites'));
    const favoriteCounts: Record<string, number> = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const destinationId = data.destinationId;
      favoriteCounts[destinationId] = (favoriteCounts[destinationId] || 0) + 1;
    });
    
    // Sort by count and take top N
    const sortedFavorites = Object.entries(favoriteCounts)
      .map(([destinationId, count]) => ({ destinationId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sortedFavorites;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get most favorited destinations');
  }
};
