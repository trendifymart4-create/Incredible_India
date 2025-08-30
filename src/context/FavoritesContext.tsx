import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  checkIfFavorited, 
  toggleFavorite, 
  getUserFavoritesWithDetails,
  subscribeToUserFavorites,
  type Favorite 
} from '../api/favorites';

interface FavoritesContextType {
  favorites: Favorite[];
  favoriteDestinationIds: Set<string>;
  isLoading: boolean;
  toggleDestinationFavorite: (destinationId: string) => Promise<void>;
  checkIfDestinationFavorited: (destinationId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log('FavoritesProvider: component rendered', { currentUser: useAuth().currentUser });
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteDestinationIds, setFavoriteDestinationIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load user's favorites when user changes
  useEffect(() => {
    console.log('FavoritesProvider: useEffect triggered', { currentUser });
    if (currentUser) {
      loadUserFavorites();
      
      // Set up real-time listener
      const unsubscribe = subscribeToUserFavorites(
        currentUser.uid,
        (userFavorites) => {
          console.log('FavoritesProvider: user favorites updated', { count: userFavorites.length });
          setFavorites(userFavorites);
          const destinationIds = new Set(userFavorites.map(fav => fav.destinationId));
          setFavoriteDestinationIds(destinationIds);
        },
        (error) => {
          console.error('Error listening to favorites:', error);
        }
      );

      return () => {
        console.log('FavoritesProvider: cleaning up subscription');
        unsubscribe();
      };
    } else {
      // Clear favorites when user logs out
      console.log('FavoritesProvider: clearing favorites');
      setFavorites([]);
      setFavoriteDestinationIds(new Set());
    }
  }, [currentUser]);

 const loadUserFavorites = async () => {
    console.log('FavoritesProvider: loadUserFavorites called', { currentUser });
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userFavorites = await getUserFavoritesWithDetails(currentUser.uid);
      console.log('FavoritesProvider: user favorites loaded', { count: userFavorites.length });
      setFavorites(userFavorites);
      const destinationIds = new Set(userFavorites.map(fav => fav.destinationId));
      setFavoriteDestinationIds(destinationIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDestinationFavorite = async (destinationId: string) => {
    if (!currentUser) {
      throw new Error('Must be logged in to manage favorites');
    }

    try {
      const newFavoriteStatus = await toggleFavorite(currentUser.uid, destinationId);
      
      // Update local state immediately for better UX
      const updatedIds = new Set(favoriteDestinationIds);
      if (newFavoriteStatus) {
        updatedIds.add(destinationId);
      } else {
        updatedIds.delete(destinationId);
      }
      setFavoriteDestinationIds(updatedIds);
      
      // The real-time listener will update the full favorites list
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const checkIfDestinationFavorited = (destinationId: string): boolean => {
    return favoriteDestinationIds.has(destinationId);
  };

  const refreshFavorites = async () => {
    if (currentUser) {
      await loadUserFavorites();
    }
  };

  const value = {
    favorites,
    favoriteDestinationIds,
    isLoading,
    toggleDestinationFavorite,
    checkIfDestinationFavorited,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
