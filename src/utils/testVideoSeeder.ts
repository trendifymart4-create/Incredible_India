// Simple client-side video seeder for testing
// Run this in browser console or add as a utility function

import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Sample videos with working embeddable YouTube IDs
const testVideos = [
  {
    youtubeId: 'M7lc1UVf-VE', // Public 360 video - should be embeddable
    title: 'VR Experience Demo',
    description: 'Sample VR experience for testing video playback functionality.',
    duration: '5:24'
  },
  {
    youtubeId: '8lsB-P8nGSM', // Another public 360 video
    title: 'Virtual Tour Sample',
    description: 'Another sample virtual tour for testing multiple videos.',
    duration: '3:45'
  }
];

export const addTestVideos = async (destinationName: string) => {
  try {
    console.log('Adding test videos for destination:', destinationName);
    
    // Get destination ID by name
    const destinationsQuery = query(
      collection(db, 'destinations'),
      where('name', '==', destinationName)
    );
    
    const destinationsSnapshot = await getDocs(destinationsQuery);
    
    if (destinationsSnapshot.empty) {
      console.error(`Destination "${destinationName}" not found`);
      return;
    }
    
    const destinationDoc = destinationsSnapshot.docs[0];
    const destinationId = destinationDoc.id;
    
    console.log('Found destination ID:', destinationId);
    
    // Add test videos
    for (const video of testVideos) {
      const videoData = {
        title: video.title,
        description: video.description,
        youtubeId: video.youtubeId,
        embedCode: `<iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}" frameborder="0" allowfullscreen></iframe>`,
        duration: video.duration,
        destinationId: destinationId,
        thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user',
        isActive: true,
        isFeatured: false,
        viewCount: 0
      };
      
      await addDoc(collection(db, 'videos'), videoData);
      console.log('Added video:', video.title);
    }
    
    console.log('Test videos added successfully!');
    
  } catch (error) {
    console.error('Error adding test videos:', error);
  }
};

// Usage: 
// addTestVideos('Taj Mahal');