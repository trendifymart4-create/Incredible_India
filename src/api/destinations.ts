// Destinations API functions
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Fallback destinations data for when Firebase is not available
const fallbackDestinations: Omit<Destination, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    image: "https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg",
    description: "An immense mausoleum of white marble, built in Agra between 1631 and 1648 by order of the Mughal emperor Shah Jahan in memory of his favourite wife.",
    rating: 4.9,
    duration: "2-3 hours",
    visitors: "8M+ annually",
    highlights: ["Ivory-white marble", "Mughal architecture", "UNESCO World Heritage"],
    vrAvailable: true,
    isActive: true
  },
  {
    name: "Hawa Mahal",
    location: "Jaipur, Rajasthan",
    image: "https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg",
    description: "A palace in Jaipur, India. Made with the red and pink sandstone, the palace sits on the edge of the City Palace, Jaipur, and extends to the Zenana, or women's chambers.",
    rating: 4.7,
    duration: "1-2 hours",
    visitors: "1M+ annually",
    highlights: ["953 windows (Jharokhas)", "Pink sandstone", "Royal architecture"],
    vrAvailable: true,
    isActive: true
  },
  {
    name: "Kerala Backwaters",
    location: "Alleppey, Kerala",
    image: "https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg",
    description: "A network of interconnected canals, rivers, lakes and inlets, a labyrinthine system formed by more than 900 km of waterways.",
    rating: 4.8,
    duration: "1-2 days",
    visitors: "1.5M+ annually",
    highlights: ["Houseboat cruises", "Lush greenery", "Serene waters"],
    vrAvailable: true,
    isActive: true
  },
  {
    name: "Goa Beaches",
    location: "Goa",
    image: "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg",
    description: "Known for its endless beaches, stellar nightlife, eclectic seafood, world-heritage listed architecture.",
    rating: 4.6,
    duration: "3-5 days",
    visitors: "7M+ annually",
    highlights: ["Golden sands", "Water sports", "Vibrant nightlife"],
    vrAvailable: true,
    isActive: true
  },
  {
    name: "Pangong Lake",
    location: "Ladakh",
    image: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg",
    description: "An endorheic lake spanning eastern Ladakh and West Tibet situated at an elevation of 4,225 m. It is 134 km long and divided into five sublakes, called Pangong Tso, Tso Nyak, Rum Tso and Nyak Tso.",
    rating: 4.9,
    duration: "Full day trip",
    visitors: "500K+ annually",
    highlights: ["High-altitude lake", "Changing colors", "Himalayan backdrop"],
    vrAvailable: true,
    isActive: true
  },
  {
    name: "Varanasi Ghats",
    location: "Varanasi, Uttar Pradesh",
    image: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg",
    description: "The city's life revolves around its seven-kilometre-long sweep of about 80 ghats that line the west bank of the holy Ganga.",
    rating: 4.8,
    duration: "1-2 days",
    visitors: "5M+ annually",
    highlights: ["Spiritual ceremonies", "Ganges river", "Ancient city"],
    vrAvailable: true,
    isActive: true
  }
];

// Load fallback destinations
const loadFallbackDestinations = (callback: (destinations: Destination[]) => void) => {
  console.log('Loading fallback destinations data');
  
  const destinations: Destination[] = fallbackDestinations.map((dest, index) => ({
    ...dest,
    id: `fallback-${index}`,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
    createdBy: 'fallback-system'
  }));
  
  // Simulate async loading
  setTimeout(() => {
    callback(destinations);
  }, 500);
};

export interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  description: string;
  rating: number;
  duration: string;
  visitors: string;
  highlights: string[];
  vrAvailable: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
}

export interface CreateDestinationData {
  name: string;
  location: string;
  image: string;
  description: string;
  rating: number;
  duration: string;
  visitors: string;
  highlights: string[];
  vrAvailable: boolean;
  createdBy: string;
}

export interface UpdateDestinationData extends Partial<CreateDestinationData> {
  updatedBy: string;
}

// Create new destination
export const createDestination = async (data: CreateDestinationData): Promise<string> => {
  try {
    const destinationData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, 'destinations'), destinationData);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create destination');
  }
};

// Update destination
export const updateDestination = async (
  id: string,
  data: UpdateDestinationData
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'destinations', id), updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update destination');
  }
};

// Delete destination
export const deleteDestination = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'destinations', id));
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete destination');
  }
};

// Get all destinations
export const getDestinations = async (): Promise<Destination[]> => {
  try {
    const q = query(
      collection(db, 'destinations'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const destinations: Destination[] = [];
    
    querySnapshot.forEach((doc) => {
      destinations.push({
        id: doc.id,
        ...doc.data()
      } as Destination);
    });
    
    return destinations;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch destinations');
  }
};

// Get single destination
export const getDestination = async (id: string): Promise<Destination | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'destinations', id));
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Destination;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch destination');
  }
};

// Real-time listener for destinations
export const subscribeToDestinations = (
  callback: (destinations: Destination[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const q = query(
      collection(db, 'destinations'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        console.log('Destinations subscription: received snapshot', { 
          empty: querySnapshot.empty, 
          size: querySnapshot.size 
        });
        
        const destinations: Destination[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          destinations.push({
            id: doc.id,
            ...data
          } as Destination);
        });
        
        console.log('Destinations subscription: processed destinations', { count: destinations.length });
        callback(destinations);
      },
      (error) => {
        console.error('Error in destinations subscription:', error);
        
        // If it's a permission or index error, try to fallback to static data
        if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
          console.log('Falling back to static destinations data due to Firestore error');
          loadFallbackDestinations(callback);
        } else if (onError) {
          onError(new Error(error.message || 'Failed to subscribe to destinations'));
        }
      }
    );
  } catch (error: any) {
    console.error('Error setting up destinations subscription:', error);
    // Fallback to static data if subscription setup fails
    loadFallbackDestinations(callback);
    
    // Return a no-op unsubscribe function
    return () => {};
  }
};

// Get destinations by location
export const getDestinationsByLocation = async (location: string): Promise<Destination[]> => {
  try {
    const q = query(
      collection(db, 'destinations'),
      where('location', '==', location),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const destinations: Destination[] = [];
    
    querySnapshot.forEach((doc) => {
      destinations.push({
        id: doc.id,
        ...doc.data()
      } as Destination);
    });
    
    return destinations;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch destinations by location');
  }
};

// Search destinations
export const searchDestinations = async (searchTerm: string): Promise<Destination[]> => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const querySnapshot = await getDocs(
      query(
        collection(db, 'destinations'),
        where('isActive', '==', true),
        orderBy('name')
      )
    );
    
    const destinations: Destination[] = [];
    const searchLower = searchTerm.toLowerCase();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const destination = { 
        id: doc.id,
        ...data
      } as Destination;
      
      // Simple text matching
      if (
        destination.name.toLowerCase().includes(searchLower) ||
        destination.location.toLowerCase().includes(searchLower) ||
        destination.description.toLowerCase().includes(searchLower) ||
        destination.highlights.some(h => h.toLowerCase().includes(searchLower))
      ) {
        destinations.push(destination);
      }
    });
    
    return destinations;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search destinations');
  }
};

// Toggle destination active status
export const toggleDestinationStatus = async (
  id: string,
  isActive: boolean,
  updatedBy: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'destinations', id), {
      isActive,
      updatedAt: serverTimestamp(),
      updatedBy
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to toggle destination status');
  }
};