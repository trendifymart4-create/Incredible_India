import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Import firebase-admin
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, './serviceAccountKey.json'), 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Sample videos with embeddable YouTube IDs
const sampleVideos = [
  {
    youtubeId: 'M7lc1UVf-VE',
    title: 'Taj Mahal 360° Virtual Tour',
    description: 'Experience the magnificent Taj Mahal in stunning 360° detail. Walk through the gardens and marvel at the architectural beauty.',
    duration: '5:24',
    destinationName: 'Taj Mahal'
  },
  {
    youtubeId: '8lsB-P8nGSM',
    title: 'Taj Mahal Sunset Experience',
    description: 'Watch the Taj Mahal transform as the sun sets, creating a magical atmosphere.',
    duration: '3:45',
    destinationName: 'Taj Mahal'
  },
  {
    youtubeId: 'hFuG7uSu7nA',
    title: 'Hawa Mahal Virtual Walkthrough',
    description: 'Explore the intricate architecture of Hawa Mahal and its 953 windows in this immersive virtual tour.',
    duration: '4:12',
    destinationName: 'Hawa Mahal'
  },
  {
    youtubeId: 'M7lc1UVf-VE',
    title: 'Kerala Backwaters Journey',
    description: 'Float through the serene backwaters of Kerala in this peaceful 360° experience.',
    duration: '6:30',
    destinationName: 'Kerala Backwaters'
  },
  {
    youtubeId: '8lsB-P8nGSM',
    title: 'Goa Beach Paradise',
    description: 'Experience the golden beaches of Goa with crystal clear waters and vibrant coastal life.',
    duration: '4:55',
    destinationName: 'Goa Beaches'
  },
  {
    youtubeId: 'hFuG7uSu7nA',
    title: 'Pangong Lake High Altitude Wonder',
    description: 'Experience the breathtaking beauty of Pangong Lake at 14,000 feet with changing colors.',
    duration: '5:18',
    destinationName: 'Pangong Lake'
  },
  {
    youtubeId: 'M7lc1UVf-VE',
    title: 'Varanasi Spiritual Journey',
    description: 'Walk along the sacred ghats of Varanasi and experience the spiritual heart of India.',
    duration: '7:22',
    destinationName: 'Varanasi Ghats'
  }
];

// Function to seed videos
async function seedVideos() {
  try {
    console.log('=== Seeding Videos ===\n');
    
    // Get all destinations to map names to IDs
    const destinationsSnapshot = await db.collection('destinations').get();
    const destinationMap = {};
    
    destinationsSnapshot.forEach(doc => {
      const data = doc.data();
      destinationMap[data.name] = doc.id;
    });
    
    console.log('Found destinations:', Object.keys(destinationMap));
    
    const videosCollection = db.collection('videos');
    let addedCount = 0;
    
    for (const video of sampleVideos) {
      const destinationId = destinationMap[video.destinationName];
      
      if (destinationId) {
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
          createdBy: 'system-seed',
          isActive: true,
          isFeatured: addedCount === 0, // First video is featured
          viewCount: 0
        };
        
        await videosCollection.add(videoData);
        console.log(`Added video: ${video.title} for ${video.destinationName}`);
        addedCount++;
      } else {
        console.warn(`Destination not found: ${video.destinationName}`);
      }
    }
    
    console.log(`\n=== Seeding Complete: ${addedCount} videos added ===`);
    
  } catch (error) {
    console.error('Error seeding videos:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
seedVideos();