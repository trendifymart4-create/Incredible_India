import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SkeletonVideo } from './SkeletonLoader';
import EnhancedVideoPlayer from './video/EnhancedVideoPlayer';
import { videoPlayerAnimations } from '../utils/videoPlayerTheme';
import type { VideoPlayerConfig } from '../types/videoPlayer';
import {
  subscribeToFeaturedVideoConfig,
  getVideo,
  Video,
  FeaturedVideoConfig,
} from '../api/videos';
import { useTranslation } from '../context/TranslationContext';

const FeaturedVideo: React.FC = () => {
  const { t } = useTranslation();
  const [video, setVideo] = useState<Video | null>(null);
  const [config, setConfig] = useState<FeaturedVideoConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToFeaturedVideoConfig(
      async (newConfig) => {
        if (newConfig && newConfig.isEnabled && (newConfig.videoId || newConfig.embedCode)) {
          setConfig(newConfig);
          try {
            // If videoId is present, fetch the video details
            if (newConfig.videoId) {
              const videoDetails = await getVideo(newConfig.videoId);
              setVideo(videoDetails);
            } else {
              // Handle embed code directly if no videoId
              setVideo({
                id: 'embedded-video',
                embedCode: newConfig.embedCode!,
                title: newConfig.title || 'Featured Video',
                description: newConfig.description || '',
              } as Video);
            }
          } catch (err) {
            setError('Failed to load featured video details.');
            setVideo(null);
          }
        } else {
          setVideo(null);
          setConfig(null);
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Featured video player configuration
  const featuredVideoConfig: VideoPlayerConfig = {
    autoplay: false,
    controls: true,
    gestures: true,
    pip: true,
    analytics: true,
    preload: 'metadata',
    playsInline: true,
    theme: {
      colors: {
        primary: '#FF6B35',
        secondary: '#2C5F6C',
        accent: '#F7931E',
        background: 'rgba(0, 0, 0, 0.8)',
        overlay: 'rgba(255, 255, 255, 0.1)',
        text: '#FFFFFF',
        textSecondary: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
    },
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonVideo />
        </div>
      </section>
    );
  }

  if (error || !config || !video) {
    return null;
  }

  // Extract YouTube video ID from different sources
  const getYouTubeId = (): string | undefined => {
    if (video.youtubeId) {
      return video.youtubeId;
    }
    
    if (video.embedCode) {
      const match = video.embedCode.match(/embed\/([^"?]+)/);
      return match?.[1];
    }
    
    return undefined;
  };

  return (
    <motion.section 
      className="py-20 bg-gray-50"
      variants={videoPlayerAnimations.fadeIn}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          className="text-4xl font-bold text-center text-gray-900 mb-12"
          variants={videoPlayerAnimations.slideUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {config.title || t('featured.title')}
        </motion.h2>

        <motion.div 
          className="relative"
          variants={videoPlayerAnimations.scaleIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <div className="relative w-full h-0 pb-[56.25%] bg-black rounded-lg overflow-hidden shadow-2xl">
            {getYouTubeId() ? (
              <EnhancedVideoPlayer
                youtubeId={getYouTubeId()}
                title={config.title || t('featured.title')}
                description={config.description}
                poster={video.thumbnail}
                config={featuredVideoConfig}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoadComplete={() => setIsVideoLoading(false)}
                onError={(error) => {
                  console.error('Featured video error:', error);
                  setError(error);
                }}
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              // Fallback for non-YouTube videos or direct embed codes
              <div className="absolute inset-0 w-full h-full">
                <iframe
                  src={video.embedCode ? 
                    `https://googleusercontent.com/youtube.com/embed/${getYouTubeId()}?rel=0&modestbranding=1&showinfo=0` :
                    `https://googleusercontent.com/youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0`
                  }
                  title={config.title || t('featured.title')}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            )}
          </div>
        </motion.div>

        {config.description && (
          <motion.div 
            className="text-center mt-8"
            variants={videoPlayerAnimations.slideUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <p className="text-gray-600 max-w-2xl mx-auto">
              {config.description}
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default FeaturedVideo;