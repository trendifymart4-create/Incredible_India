// Image preloading utility for loading all app images at startup
import { preloadImage } from './imageUtils';

// Collect all image URLs from across the application
export const APP_IMAGES = {
  // Hero component images
  hero: [
    'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
  ],
  
  // Homepage destinations grid images (separate from destinations page)
  homepageDestinations: [
    'https://images.pexels.com/photos/16783937/pexels-photo-16783937.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/3574678/pexels-photo-3574678.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/3571551/pexels-photo-3571551.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  ],
  
  // VR Tours page images
  vrTours: [
    'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1588584435653-3f36d5f9a8d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1650374772013-7f1da10b4d6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
  ],
  
  // About India page images
  aboutIndia: [
    'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1582652516232-60ac2b6be895?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
  ],
  
  // Contact page images
  contact: [
    'https://images.unsplash.com/photo-1595658658481-d53835c8309b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80',
    'https://s7ap1.scene7.com/is/image/incredibleindia/marina-beach-chennai-tamil-nadu-2-attr-hero?qlt=82&ts=1726655020013',
    'https://images.unsplash.com/photo-1580800917311-bb19a8013d9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
  ],
  
  // Destinations page images - completely unique set without Hero repetition
  destinations: [
    'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/2531709/pexels-photo-2531709.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/4429277/pexels-photo-4429277.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    // Destination grid images for dedicated destinations page only
    'https://images.pexels.com/photos/16783937/pexels-photo-16783937.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/3574678/pexels-photo-3574678.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/3571551/pexels-photo-3571551.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
    'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop'
  ]
};

// Flatten all images into a single array
const getAllImages = (): string[] => {
  return [
    ...APP_IMAGES.hero,
    ...APP_IMAGES.homepageDestinations,
    ...APP_IMAGES.vrTours,
    ...APP_IMAGES.aboutIndia,
    ...APP_IMAGES.contact,
    ...APP_IMAGES.destinations
  ];
};

// Image preload status interface
export interface PreloadStatus {
  totalImages: number;
  loadedImages: number;
  failedImages: number;
  isComplete: boolean;
  progress: number; // Percentage (0-100)
  errors: string[];
}

// Preload all images with progress tracking
export const preloadAllImages = (
  onProgress?: (status: PreloadStatus) => void
): Promise<PreloadStatus> => {
  return new Promise((resolve) => {
    const allImages = getAllImages();
    const totalImages = allImages.length;
    let loadedImages = 0;
    let failedImages = 0;
    const errors: string[] = [];

    const updateProgress = () => {
      const progress = Math.round(((loadedImages + failedImages) / totalImages) * 100);
      const status: PreloadStatus = {
        totalImages,
        loadedImages,
        failedImages,
        isComplete: loadedImages + failedImages === totalImages,
        progress,
        errors
      };

      if (onProgress) {
        onProgress(status);
      }

      if (status.isComplete) {
        resolve(status);
      }
    };

    // Start preloading all images
    allImages.forEach((imageUrl, index) => {
      preloadImage(imageUrl)
        .then(() => {
          loadedImages++;
          console.log(`✅ Image ${index + 1}/${totalImages} loaded: ${imageUrl.substring(0, 80)}...`);
          updateProgress();
        })
        .catch((error) => {
          failedImages++;
          errors.push(`Failed to load: ${imageUrl} - ${error.message}`);
          console.warn(`❌ Image ${index + 1}/${totalImages} failed: ${imageUrl.substring(0, 80)}...`, error);
          updateProgress();
        });
    });
  });
};

// Preload images for specific page
export const preloadPageImages = (
  page: keyof typeof APP_IMAGES,
  onProgress?: (status: PreloadStatus) => void
): Promise<PreloadStatus> => {
  return new Promise((resolve) => {
    const pageImages = APP_IMAGES[page];
    const totalImages = pageImages.length;
    let loadedImages = 0;
    let failedImages = 0;
    const errors: string[] = [];

    const updateProgress = () => {
      const progress = Math.round(((loadedImages + failedImages) / totalImages) * 100);
      const status: PreloadStatus = {
        totalImages,
        loadedImages,
        failedImages,
        isComplete: loadedImages + failedImages === totalImages,
        progress,
        errors
      };

      if (onProgress) {
        onProgress(status);
      }

      if (status.isComplete) {
        resolve(status);
      }
    };

    pageImages.forEach((imageUrl, index) => {
      preloadImage(imageUrl)
        .then(() => {
          loadedImages++;
          console.log(`✅ ${page} image ${index + 1}/${totalImages} loaded`);
          updateProgress();
        })
        .catch((error) => {
          failedImages++;
          errors.push(`Failed to load: ${imageUrl} - ${error.message}`);
          console.warn(`❌ ${page} image ${index + 1}/${totalImages} failed:`, error);
          updateProgress();
        });
    });
  });
};

// Check if image is already cached in browser
export const isImageCached = (imageUrl: string): boolean => {
  try {
    const img = new Image();
    img.src = imageUrl;
    return img.complete && img.naturalWidth > 0;
  } catch {
    return false;
  }
};

// Get preload statistics
export const getPreloadStats = (): { 
  totalImages: number; 
  cachedImages: number; 
  cachePercentage: number; 
} => {
  const allImages = getAllImages();
  const totalImages = allImages.length;
  const cachedImages = allImages.filter(isImageCached).length;
  const cachePercentage = Math.round((cachedImages / totalImages) * 100);

  return {
    totalImages,
    cachedImages,
    cachePercentage
  };
};

// Warm up image cache on app startup
export const warmupImageCache = async (): Promise<void> => {
  console.log('🚀 Starting image cache warmup...');
  
  const startTime = Date.now();
  
  const status = await preloadAllImages((progress) => {
    console.log(`📈 Image preload progress: ${progress.progress}% (${progress.loadedImages}/${progress.totalImages} loaded, ${progress.failedImages} failed)`);
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`🎉 Image preloading completed in ${duration}ms`);
  console.log(`📊 Final stats: ${status.loadedImages} loaded, ${status.failedImages} failed out of ${status.totalImages} total`);
  
  if (status.failedImages > 0) {
    console.warn('⚠️ Some images failed to preload:', status.errors);
  }
};