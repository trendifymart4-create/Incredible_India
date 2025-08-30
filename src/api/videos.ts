// Videos API functions
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
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  embedCode: string;
  duration: string;
  destinationId: string;
  thumbnailUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
}

export interface CreateVideoData {
  title: string;
  description: string;
  youtubeId?: string;
  embedCode?: string;
  duration: string;
  destinationId: string;
  thumbnailUrl?: string;
  createdBy: string;
  isFeatured?: boolean;
}

export interface UpdateVideoData extends Partial<CreateVideoData> {
  updatedBy: string;
}

export interface FeaturedVideoConfig {
  videoId?: string;
  embedCode?: string;
  title?: string;
  description?: string;
  isEnabled: boolean;
  updatedAt: Timestamp;
  updatedBy: string;
}

// Extract YouTube video ID from various URL formats
export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

// Extract YouTube ID from embed code
export const extractYouTubeIdFromEmbed = (embedCode: string): string | null => {
  const match = embedCode.match(/src="[^"]*\/embed\/([^"?]+)/);
  return match ? match[1] : null;
};

// Create sample videos for testing when no videos exist
const createSampleVideosForDestination = (destinationId: string): Video[] => {
  const sampleVideos = [
    {
      youtubeId: 'M7lc1UVf-VE', // "360° Video: Explore the World" - embeddable
      title: 'Virtual Tour - Destination Experience',
      description: 'Immersive 360° virtual tour showcasing the beauty and culture of this amazing destination.',
      duration: '5:24'
    },
    {
      youtubeId: '8lsB-P8nGSM', // "360° Video: Nature Experience" - embeddable
      title: 'Cultural Heritage Experience',
      description: 'Explore the rich cultural heritage and traditions through this immersive VR experience.',
      duration: '3:45'
    },
    {
      youtubeId: 'hFuG7uSu7nA', // "360° Video: Travel Experience" - embeddable
      title: 'Historic Landmarks Tour',
      description: 'Take a journey through historic landmarks and architectural marvels in stunning 360° detail.',
      duration: '4:12'
    }
  ];

  return sampleVideos.map((video, index) => ({
    id: `sample-${destinationId}-${index}`,
    title: video.title,
    description: video.description,
    youtubeId: video.youtubeId,
    embedCode: `<iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}" frameborder="0" allowfullscreen></iframe>`,
    duration: video.duration,
    destinationId,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Timestamp,
    createdBy: 'system',
    isActive: true,
    isFeatured: index === 0,
    viewCount: 0
  }));
};

// Create new video
export const createVideo = async (data: CreateVideoData): Promise<string> => {
  try {
    // Extract YouTube ID if not provided
    let youtubeId = data.youtubeId;
    if (!youtubeId && data.embedCode) {
      youtubeId = extractYouTubeIdFromEmbed(data.embedCode);
    }
    
    // Generate thumbnail URL if not provided
    let thumbnailUrl = data.thumbnailUrl;
    if (!thumbnailUrl && youtubeId) {
      thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
    }
    
    const videoData = {
      ...data,
      youtubeId: youtubeId || '',
      thumbnailUrl: thumbnailUrl || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      isFeatured: data.isFeatured || false,
      viewCount: 0
    };
    
    const docRef = await addDoc(collection(db, 'videos'), videoData);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create video');
  }
};

// Update video
export const updateVideo = async (
  id: string,
  data: UpdateVideoData
): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    // Extract YouTube ID if embed code is updated
    if (data.embedCode && !data.youtubeId) {
      const youtubeId = extractYouTubeIdFromEmbed(data.embedCode);
      if (youtubeId) {
        updateData.youtubeId = youtubeId;
        updateData.thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
      }
    }
    
    await updateDoc(doc(db, 'videos', id), updateData);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update video');
  }
};

// Delete video
export const deleteVideo = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'videos', id));
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete video');
  }
};

// Get videos by destination
export const getVideosByDestination = async (destinationId: string): Promise<Video[]> => {
  try {
    const q = query(
      collection(db, 'videos'),
      where('destinationId', '==', destinationId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const videos: Video[] = [];
    
    querySnapshot.forEach((doc) => {
      const videoData = doc.data();
      videos.push({
        id: doc.id,
        ...videoData
      } as Video);
    });
    
    return videos;
  } catch (error: any) {
    // Re-throw the error instead of falling back to sample videos
    throw new Error(error.message || 'Failed to fetch videos');
  }
};

// Get single video
export const getVideo = async (id: string): Promise<Video | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'videos', id));
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Video;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch video');
  }
};

// Real-time listener for all videos
export const subscribeToAllVideos = (
  callback: (videos: Video[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'videos'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const videos: Video[] = [];

      querySnapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data()
        } as Video);
      });

      callback(videos);
    },
    (error) => {
      console.error('Error in videos subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to videos'));
      }
    }
  );
};

// Real-time listener for videos by destination
export const subscribeToVideosByDestination = (
  destinationId: string,
  callback: (videos: Video[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'videos'),
    where('destinationId', '==', destinationId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const videos: Video[] = [];
      
      querySnapshot.forEach((doc) => {
        videos.push({
          id: doc.id,
          ...doc.data()
        } as Video);
      });
      
      callback(videos);
    },
    (error) => {
      console.error('Error in videos subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to videos'));
      }
    }
  );
};

// Increment video view count
export const incrementVideoViews = async (id: string): Promise<void> => {
  try {
    const videoRef = doc(db, 'videos', id);
    const videoSnap = await getDoc(videoRef);
    
    if (videoSnap.exists()) {
      const currentViews = videoSnap.data().viewCount || 0;
      await updateDoc(videoRef, {
        viewCount: currentViews + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error: any) {
    console.error('Failed to increment video views:', error);
  }
};

// Featured video management
export const setFeaturedVideo = async (config: Omit<FeaturedVideoConfig, 'updatedAt'>): Promise<void> => {
  try {
    const configData = {
      ...config,
      updatedAt: serverTimestamp()
    };
    
    // Use setDoc with merge to create or update the document
    await setDoc(doc(db, 'config', 'featuredVideo'), configData, { merge: true });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to set featured video');
  }
};

// Get featured video configuration
export const getFeaturedVideoConfig = async (): Promise<FeaturedVideoConfig | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'featuredVideo'));
    
    if (docSnap.exists()) {
      return docSnap.data() as FeaturedVideoConfig;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch featured video config');
  }
};

// Real-time listener for featured video config
export const subscribeToFeaturedVideoConfig = (
  callback: (config: FeaturedVideoConfig | null) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    doc(db, 'config', 'featuredVideo'),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data() as FeaturedVideoConfig);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in featured video config subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to featured video config'));
      }
    }
  );
};

// Toggle video active status
export const toggleVideoStatus = async (
  id: string,
  isActive: boolean,
  updatedBy: string
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'videos', id), {
      isActive,
      updatedAt: serverTimestamp(),
      updatedBy
    });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to toggle video status');
  }
};