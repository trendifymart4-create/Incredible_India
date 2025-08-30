// Image utility functions for handling fallbacks and lazy loading

export const createImageWithFallback = (
  src: string,
  fallbackSrc: string = '/assets/fallback.jpg',
  alt: string = 'Image'
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Try fallback image
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => reject(new Error('Both primary and fallback images failed to load'));
      fallbackImg.src = fallbackSrc;
      fallbackImg.alt = alt;
    };
    
    img.src = src;
    img.alt = alt;
  });
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
};

export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
  } catch {
    return false;
  }
};

export const getOptimizedPexelsUrl = (originalUrl: string, width: number = 1920, height: number = 1080): string => {
  try {
    // Check if it's a Pexels URL
    if (originalUrl.includes('pexels.com')) {
      // Ensure we're using the optimized format
      const baseUrl = originalUrl.split('?')[0];
      return `${baseUrl}?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;
    }
    return originalUrl;
  } catch {
    return originalUrl;
  }
};

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = event.currentTarget;
  if (img.src !== '/assets/fallback.jpg') {
    img.src = '/assets/fallback.jpg';
  }
};

export const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
  const video = event.currentTarget;
  if (video.src !== '/assets/fallback-video.mp4') {
    video.src = '/assets/fallback-video.mp4';
  }
};