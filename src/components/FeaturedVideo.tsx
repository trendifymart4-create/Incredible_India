import React, { useState, useEffect } from 'react';
import { SkeletonVideo } from './SkeletonLoader';
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
    return null; // Don't render the section if no video is configured, disabled, or an error occurred
  }

  const videoId = video.youtubeId || (video.embedCode ? '' : 'dQw4w9WgXcQ');
  const videoSrc = video.embedCode
    ? `https://googleusercontent.com/youtube.com/embed/${video.embedCode.match(/embed\/([^"?]+)/)?.[1] || ''}?rel=0&modestbranding=1&showinfo=0`
    : `https://googleusercontent.com/youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`;


  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          {config.title || t('featured.title')}
        </h2>

        <div className="relative w-full h-0 pb-[56.25%] bg-black rounded-lg overflow-hidden shadow-2xl">
          <iframe
            src={videoSrc}
            title={config.title || t('featured.title')}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        {config.description && (
          <div className="text-center mt-8">
            <p className="text-gray-600 max-w-2xl mx-auto">
              {config.description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedVideo;