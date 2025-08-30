import React, { useState, useEffect, useRef } from 'react';
import { Play, Lock, Star, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Destination } from './Destinations';
import PaymentModal from './PaymentModal';
import { getVideosByDestination, type Video } from '../api/videos';
import { useAuth } from '../context/AuthContext';
import SecureVideoPlayer from './video/SecureVideoPlayer';

interface FixedVRExperienceProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

const FixedVRExperience: React.FC<FixedVRExperienceProps> = ({ destination, isOpen, onClose }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [previewTime, setPreviewTime] = useState(60);
  const [isPreviewExpired, setIsPreviewExpired] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser, isPremium, upgradeToPremium, refreshUserProfile } = useAuth();
  
  // Use premium state from AuthContext
  const hasAccess = isPremium;
  
  // Derived state - calculate after videos state is defined
  const currentVideo = videos[currentVideoIndex];
  const hasVideos = videos.length > 0;

  // Fetch videos when the destination changes
  useEffect(() => {
    if (destination) {
      setIsVideoLoading(true);
      setVideoError(false);
      setVideos([]);
      
      getVideosByDestination(destination.id)
        .then((fetchedVideos) => {
          const activeVideos = fetchedVideos.filter(video => video.isActive);
          setVideos(activeVideos);
          setIsVideoLoading(false);
        })
        .catch((error) => {
          setVideoError(true);
          setIsVideoLoading(false);
        });
    }
  }, [destination]);

  // Preview timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !hasAccess && previewTime > 0 && hasVideos && !videoError && !isVideoLoading && isVideoPlaying && videoStarted && !isPaused) {
      timer = setInterval(() => {
        setPreviewTime((prev) => {
          if (prev <= 1) {
            setIsPreviewExpired(true);
            setIsVideoPlaying(false);
            setIsPaused(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, hasAccess, previewTime, hasVideos, videoError, isVideoLoading, isVideoPlaying, videoStarted, isPaused]);

  // Reset video state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setVideoError(false);
      if (videos.length === 0) {
        setIsVideoLoading(true);
      }
      setCurrentVideoIndex(0);
      setPreviewTime(60);
      setIsPreviewExpired(false);
      setIsVideoPlaying(false);
      setVideoStarted(false);
      setIsPaused(false);
    }
  }, [isOpen, videos.length]);

  // Handle payment success
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

  // Change video handler
  const changeVideo = (index: number) => {
    if (!hasAccess && isPreviewExpired) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    setCurrentVideoIndex(index);
    setVideoError(false);
    setIsVideoLoading(true);
    setPreviewTime(60);
    setIsPreviewExpired(false);
    setIsVideoPlaying(false);
    setVideoStarted(false);
    setIsPaused(false);
  };

  if (!destination || !isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{destination.name}</h2>
              <p className="text-sm text-gray-600 flex items-center space-x-2">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span>{destination.rating} • {destination.location}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Enhanced VR Player - Fixed */}
          <motion.div
            ref={videoContainerRef}
            className="relative w-full bg-black"
            style={{ height: '60vh', minHeight: '400px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {hasVideos && currentVideo ? (
              <>
                {/* Fixed Enhanced Video Player */}
                <SecureVideoPlayer
                  youtubeId={currentVideo.youtubeId}
                  
                  title={currentVideo.title}
                  description={currentVideo.description}
                  duration={currentVideo.duration}
                  poster={currentVideo.thumbnailUrl}
                  autoplay={false}
                  controls={hasAccess}
                  onPlay={() => {
                    setIsVideoPlaying(true);
                    setIsPaused(false);
                    if (!videoStarted) {
                      setVideoStarted(true);
                    }
                  }}
                  onPause={() => {
                    setIsVideoPlaying(false);
                    setIsPaused(true);
                  }}
                  onEnded={() => {
                    setIsVideoPlaying(false);
                    setIsPaused(false);
                  }}
                  onError={(error) => {
                    setVideoError(true);
                    setIsVideoLoading(false);
                  }}
                  onLoadStart={() => {
                    setIsVideoLoading(true);
                  }}
                  onLoadComplete={() => {
                    setIsVideoLoading(false);
                  }}
                  className="w-full h-full"
                />
                
                {/* Preview Timer Overlay */}
                <AnimatePresence>
                  {!hasAccess && previewTime > 0 && videoStarted && (
                    <motion.div
                      className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg z-50"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <p className="text-sm flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Preview: {previewTime}s</span>
                        {isPaused && (
                          <span className="text-orange-400 text-xs">(Paused)</span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Video Navigation Dots */}
                <AnimatePresence>
                  {videos.length > 1 && !videoError && (
                    <motion.div
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-40"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                    >
                      {videos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => changeVideo(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentVideoIndex
                              ? 'bg-orange-500'
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* No videos fallback */
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  {isVideoLoading ? (
                    <>
                      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading Videos...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-lg font-medium">No VR Experience Available</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
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
                    <Lock className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                    <h3 className="text-xl font-bold mb-2">Unlock Full Experience</h3>
                    <p className="text-gray-300 mb-6">
                      Continue exploring {destination.name} in stunning 360° detail
                    </p>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-all w-full"
                    >
                      Unlock for $4.99
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Content - Compact with hover effects */}
          <div className="p-4 transition-all duration-300 group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Description */}
              <div className="transition-transform duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-2 transition-all duration-300">About This Experience</h3>
                <p className="text-sm text-gray-600 mb-3 transition-all duration-300 line-clamp-3">{destination.description}</p>
                
                {hasVideos && currentVideo && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg transition-all duration-300">
                    <h4 className="font-medium text-blue-800 mb-1 text-sm transition-all duration-300">Current Video</h4>
                    <p className="text-xs text-blue-700 transition-all duration-300 line-clamp-2">{currentVideo.description}</p>
                  </div>
                )}

                <div className="space-y-2 transition-all duration-300">
                  <div className="flex items-center space-x-2 text-xs text-gray-500 transition-all duration-300">
                    <Clock className="w-3 h-3 transition-all duration-300" />
                    <span>Duration: {destination.duration}</span>
                  </div>
                  {hasVideos && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500 transition-all duration-300">
                      <Play className="w-3 h-3 transition-all duration-300" />
                      <span>{videos.length} video{videos.length !== 1 ? 's' : ''} available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Highlights */}
              <div className="transition-transform duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-2 transition-all duration-300">Experience Highlights</h3>
                <div className="space-y-1.5 transition-all duration-300">
                  {destination.highlights.slice(0, 5).map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full transition-all duration-300"></div>
                      <span className="text-sm text-gray-700 transition-all duration-300">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* Video List */}
                {hasVideos && videos.length > 1 && (
                  <div className="mt-4 transition-all duration-300">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm transition-all duration-300">Available Videos</h4>
                    <div className="space-y-1.5 transition-all duration-300">
                      {videos.slice(0, 3).map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => changeVideo(index)}
                          className={`w-full text-left p-2 rounded transition-all ${
                            index === currentVideoIndex
                              ? 'bg-orange-50 border border-orange-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <p className="font-medium text-xs transition-all duration-300">{video.title}</p>
                          <p className="text-[10px] text-gray-500 transition-all duration-300">{video.duration}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!hasAccess && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg transition-all duration-300">
                    <h4 className="font-medium text-orange-800 mb-1.5 text-sm transition-all duration-300">Premium Features</h4>
                    <ul className="text-xs text-orange-700 space-y-0.5 transition-all duration-300">
                      <li>• Full 360° immersive experience</li>
                      <li>• High-resolution 4K quality</li>
                      <li>• Interactive hotspots</li>
                      <li>• Audio narration</li>
                      <li>• Unlimited access</li>
                      {hasVideos && <li>• Access to all {videos.length} videos</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 transition-all duration-300">
              {!hasAccess ? (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all transform hover:scale-105 text-sm"
                >
                  Unlock Full Experience - $4.99
                </button>
              ) : (
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all text-sm">
                  Enjoy Your VR Experience
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-semibold transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        destination={destination}
      />
    </>
  );
};

export default FixedVRExperience;
