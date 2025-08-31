import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  X,
  RotateCcw,
  Lock,
  Star,
  Clock,
} from 'lucide-react';
import type { Destination } from '../Destinations';
import { getVideosByDestination, type Video } from '../../api/videos';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from '../PaymentModal';
import SecureVideoPlayer from '../video/SecureVideoPlayer';

interface EnhancedMobileVideoModalProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedMobileVideoModal: React.FC<EnhancedMobileVideoModalProps> = ({
  destination,
  isOpen,
  onClose,
}) => {
  // State management
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [previewTime, setPreviewTime] = useState(60);
  const [isPreviewExpired, setIsPreviewExpired] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Auth context
  const { currentUser, isPremium, upgradeToPremium, refreshUserProfile } = useAuth();
  const hasAccess = isPremium;
  const currentVideo = videos[currentVideoIndex];

  // Orientation detection with enhanced mobile support
  useEffect(() => {
    const handleOrientationChange = () => {
      const orientation = screen.orientation?.type || window.orientation;
      const newIsLandscape = 
        orientation === 'landscape-primary' || 
        orientation === 'landscape-secondary' || 
        Math.abs(Number(orientation)) === 90;
      
      setIsLandscape(newIsLandscape);
      
      // Auto-adjust modal size based on orientation
      if (containerRef.current) {
        if (newIsLandscape) {
          containerRef.current.classList.add('landscape-mode');
          containerRef.current.classList.remove('portrait-mode');
        } else {
          containerRef.current.classList.add('portrait-mode');
          containerRef.current.classList.remove('landscape-mode');
        }
      }
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  // Fetch videos
  useEffect(() => {
    if (destination && isOpen) {
      setIsLoading(true);
      setHasError(false);
      setVideos([]);
      
      getVideosByDestination(destination.id)
        .then((fetchedVideos) => {
          const activeVideos = fetchedVideos.filter(video => video.isActive);
          setVideos(activeVideos);
          setIsLoading(false);
        })
        .catch((error) => {
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [destination, isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentVideoIndex(0);
      setIsPlaying(false);
      setIsPaused(false);
      setPreviewTime(60);
      setIsPreviewExpired(false);
      setVideoStarted(false);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Preview timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      isOpen &&
      !hasAccess &&
      previewTime > 0 &&
      videos.length > 0 &&
      !hasError &&
      !isLoading &&
      isPlaying &&
      videoStarted &&
      !isPaused
    ) {
      timer = setInterval(() => {
        setPreviewTime((prev) => {
          if (prev <= 1) {
            setIsPreviewExpired(true);
            setIsPlaying(false);
            setIsPaused(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, hasAccess, previewTime, videos.length, hasError, isLoading, isPlaying, videoStarted, isPaused]);

  const handleRotateScreen = useCallback(() => {
    if (screen.orientation && screen.orientation.lock) {
      try {
        if (isLandscape) {
          screen.orientation.lock('portrait-primary');
        } else {
          screen.orientation.lock('landscape-primary');
        }
      } catch (error) {
        console.error('Screen rotation error:', error);
        // Fallback: manually trigger orientation change
        const event = new Event('orientationchange');
        window.dispatchEvent(event);
      }
    }
  }, [isLandscape]);

  const changeVideo = useCallback((index: number) => {
    if (!hasAccess && isPreviewExpired) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    setCurrentVideoIndex(index);
    setIsLoading(true);
    setHasError(false);
    setPreviewTime(60);
    setIsPreviewExpired(false);
    setIsPlaying(false);
    setVideoStarted(false);
    setIsPaused(false);
  }, [hasAccess, isPreviewExpired]);

  const handlePaymentSuccess = async () => {
    try {
      await upgradeToPremium();
      await refreshUserProfile();
      
      setIsPaymentModalOpen(false);
      setPreviewTime(0);
      setIsPreviewExpired(false);
    } catch (error) {
      console.error('Error upgrading user to premium:', error);
      alert('Payment successful but there was an error upgrading your account. Please contact support.');
    }
  };

  if (!destination || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black z-50 flex flex-col ${
          isLandscape ? 'landscape-mode' : 'portrait-mode'
        }`}
      >
        {/* Header - Hidden in fullscreen landscape */}
        {(!isFullscreen || !isLandscape) && (
          <motion.div
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            className="relative z-10 bg-black/80 backdrop-blur-sm text-white p-4 video-modal-safe-top"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{destination.name}</h2>
                <p className="text-sm text-gray-300 flex items-center space-x-2">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span>{destination.rating} • {destination.location}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRotateScreen}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors mobile-btn haptic-light"
                  title="Rotate Screen"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors mobile-btn haptic-light"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Video Container */}
        <div 
          className={`flex-1 relative bg-black video-container-mobile ${
            isLandscape ? 'landscape' : 'portrait'
          }`}
        >
          {videos.length > 0 && currentVideo ? (
            <>
              {/* Enhanced Video Player */}
              <SecureVideoPlayer
                youtubeId={currentVideo.youtubeId}
                title={currentVideo.title}
                description={currentVideo.description}
                duration={currentVideo.duration}
                poster={currentVideo.thumbnailUrl}
                autoplay={false}
                controls={hasAccess}
                onPlay={() => {
                  setIsPlaying(true);
                  setIsPaused(false);
                  if (!videoStarted) {
                    setVideoStarted(true);
                  }
                }}
                onPause={() => {
                  setIsPlaying(false);
                  setIsPaused(true);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setIsPaused(false);
                }}
                onError={(error) => {
                  setHasError(true);
                  setIsLoading(false);
                }}
                onLoadStart={() => {
                  setIsLoading(true);
                }}
                onLoadComplete={() => {
                  setIsLoading(false);
                }}
                className="w-full h-full video-player-mobile"
              />

              {/* Preview Timer */}
              <AnimatePresence>
                {!hasAccess && previewTime > 0 && videoStarted && (
                  <motion.div
                    className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg z-50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <p className="text-sm flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Preview: {previewTime}s</span>
                      {isPaused && (
                        <span className="text-orange-200 text-xs">(Paused)</span>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Navigation Dots */}
              <AnimatePresence>
                {videos.length > 1 && !hasError && (
                  <motion.div
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-40"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    {videos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => changeVideo(index)}
                        className={`w-3 h-3 rounded-full transition-all mobile-btn haptic-light ${
                          index === currentVideoIndex
                            ? 'bg-red-600'
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview Expired Overlay */}
              <AnimatePresence>
                {!hasAccess && previewTime <= 0 && (
                  <motion.div
                    className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-center text-white max-w-sm px-6">
                      <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
                      <h3 className="text-xl font-bold mb-2">Unlock Full Experience</h3>
                      <p className="text-gray-300 mb-6">
                        Continue exploring {destination.name} in stunning detail
                      </p>
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all w-full mobile-btn haptic-medium"
                      >
                        Unlock for $4.99
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* No videos fallback */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                {isLoading ? (
                  <>
                    <div className="w-12 h-12 border-4 border-white/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Loading Videos...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-lg font-medium">No VR Experience Available</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Content - Hidden in fullscreen landscape */}
        {(!isFullscreen || !isLandscape) && videos.length > 0 && currentVideo && (
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-white video-modal-safe-bottom"
            style={{
              maxHeight: isLandscape ? '30vh' : '40vh',
              overflowY: 'auto',
            }}
          >
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{currentVideo.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{currentVideo.description}</p>
              
              {/* Video List */}
              {videos.length > 1 && (
                <div className="space-y-3 mb-4">
                  <h4 className="font-medium text-gray-900 text-sm">More Videos</h4>
                  <div className="flex space-x-2 overflow-x-auto pb-2 scroll-smooth">
                    {videos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => changeVideo(index)}
                        className={`flex-shrink-0 p-2 rounded-lg transition-all text-left min-w-32 mobile-btn haptic-light ${
                          index === currentVideoIndex
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <p className="text-xs font-medium truncate">{video.title}</p>
                        <p className="text-xs text-gray-500">{video.duration}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!hasAccess ? (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-4 rounded-lg font-semibold transition-all text-sm mobile-btn haptic-medium"
                  >
                    Unlock - $4.99
                  </button>
                ) : (
                  <div className="flex-1 bg-green-100 text-green-800 py-2 px-4 rounded-lg font-semibold text-sm text-center">
                    Premium Access
                  </div>
                )}
                
                <button
                  onClick={onClose}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors text-sm mobile-btn haptic-light"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          destination={destination}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedMobileVideoModal;
