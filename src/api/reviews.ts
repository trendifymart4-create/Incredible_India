// Reviews API functions
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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  destinationId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  isHidden: boolean;
}

export interface CreateReviewData {
  userId: string;
  userName: string;
  userAvatar?: string;
  destinationId: string;
  rating: number;
  title: string;
  comment: string;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Create new review
export const createReview = async (data: CreateReviewData): Promise<string> => {
  try {
    const reviewData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isVerified: false,
      helpfulCount: 0,
      reportCount: 0,
      isHidden: false
    };
    
    const docRef = await addDoc(collection(db, 'reviews'), reviewData);
    
    // Update destination rating after adding review
    await updateDestinationRating(data.destinationId);
    
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create review');
  }
};

// Update review
export const updateReview = async (
  id: string,
  data: UpdateReviewData
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(doc(db, 'reviews', id), updateData);
    
    // Get the review to find destination ID and update rating
    const reviewDoc = await getDoc(doc(db, 'reviews', id));
    if (reviewDoc.exists()) {
      const reviewData = reviewDoc.data() as Review;
      await updateDestinationRating(reviewData.destinationId);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update review');
  }
};

// Delete review
export const deleteReview = async (id: string): Promise<void> => {
  try {
    // Get the review to find destination ID before deleting
    const reviewDoc = await getDoc(doc(db, 'reviews', id));
    let destinationId: string | null = null;
    
    if (reviewDoc.exists()) {
      const reviewData = reviewDoc.data() as Review;
      destinationId = reviewData.destinationId;
    }
    
    await deleteDoc(doc(db, 'reviews', id));
    
    // Update destination rating after deleting review
    if (destinationId) {
      await updateDestinationRating(destinationId);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete review');
  }
};

// Get reviews by destination
export const getReviewsByDestination = async (destinationId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('destinationId', '==', destinationId),
      where('isHidden', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      } as Review);
    });
    
    return reviews;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch reviews');
  }
};

// Get reviews by user
export const getReviewsByUser = async (userId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      } as Review);
    });
    
    return reviews;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user reviews');
  }
};

// Get single review
export const getReview = async (id: string): Promise<Review | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'reviews', id));
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Review;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch review');
  }
};

// Get latest reviews across all destinations
export const getLatestReviews = async (limit: number = 5): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('isHidden', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];

    querySnapshot.forEach((doc) => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      } as Review);
    });

    return reviews.slice(0, limit);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch latest reviews');
  }
};

// Real-time listener for reviews by destination
export const subscribeToReviewsByDestination = (
  destinationId: string,
  callback: (reviews: Review[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'reviews'),
    where('destinationId', '==', destinationId),
    where('isHidden', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const reviews: Review[] = [];
      
      querySnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data()
        } as Review);
      });
      
      callback(reviews);
    },
    (error) => {
      console.error('Error in reviews subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to reviews'));
      }
    }
  );
};

// Get review statistics for a destination
export const getReviewStats = async (destinationId: string): Promise<ReviewStats> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('destinationId', '==', destinationId),
      where('isHidden', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push(doc.data() as Review);
    });
    
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });
    
    return {
      totalReviews,
      averageRating,
      ratingDistribution
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch review statistics');
  }
};

// Update destination rating based on reviews
export const updateDestinationRating = async (destinationId: string): Promise<void> => {
  try {
    const stats = await getReviewStats(destinationId);
    
    await updateDoc(doc(db, 'destinations', destinationId), {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Failed to update destination rating:', error);
  }
};

// Mark review as helpful
export const markReviewHelpful = async (id: string): Promise<void> => {
  try {
    const reviewRef = doc(db, 'reviews', id);
    const reviewSnap = await getDoc(reviewRef);
    
    if (reviewSnap.exists()) {
      const currentCount = reviewSnap.data().helpfulCount || 0;
      await updateDoc(reviewRef, {
        helpfulCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to mark review as helpful');
  }
};

// Report review
export const reportReview = async (id: string): Promise<void> => {
  try {
    const reviewRef = doc(db, 'reviews', id);
    const reviewSnap = await getDoc(reviewRef);
    
    if (reviewSnap.exists()) {
      const currentCount = reviewSnap.data().reportCount || 0;
      await updateDoc(reviewRef, {
        reportCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to report review');
  }
};

// Hide/unhide review (admin only)
export const toggleReviewVisibility = async (
  id: string,
  isHidden: boolean
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reviews', id), {
      isHidden,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to toggle review visibility');
  }
};

// Verify review (admin only)
export const verifyReview = async (id: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reviews', id), {
      isVerified: true,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to verify review');
  }
};