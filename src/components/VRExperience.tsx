import React, { useState, useEffect, useRef } from 'react';
import { Play, Lock, Star, Clock, X, Maximize, Minimize, Shield, Heart, Share2, Download, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Destination } from './Destinations';
import PaymentModal from './PaymentModal';
import { getVideosByDestination, type Video } from '../api/videos';
import { useAuth } from '../context/AuthContext';
import SecureVideoPlayer from './video/SecureVideoPlayer';
import { videoPlayerAnimations } from '../utils/videoPlayerTheme';

interface VRExperienceProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

const VRExperience: React.FC<VRExperienceProps> = ({ destination, isOpen, onClose }) => {
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
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [showVideoInfo, setShowVideoInfo] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
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
      setShowVideoInfo(true);
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

  // Fullscreen handler
  const toggleFullscreen = () => {
    setIsFullscreenMode(!isFullscreenMode);
  };

  // Video interaction handlers
  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    setIsPaused(false);
    if (!videoStarted) {
      setVideoStarted(true);
      // Increment view count
      setViewCount(prev => prev + 1);
    }
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    setIsPaused(true);
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    setIsPaused(false);
  };

  const handleVideoError = (error: string) => {
    setVideoError(true);
    setIsVideoLoading(false);
    console.error('Video playback error:', error);
  };

  const handleVideoTimeUpdate = (currentTime: number, duration: number) => {
    // Handle preview time countdown for non-premium users
    if (!hasAccess && videoStarted && !isPaused) {
      const remainingTime = Math.max(0, 60 - currentTime);
      setPreviewTime(Math.ceil(remainingTime));
      
      if (remainingTime <= 0) {
        setIsPreviewExpired(true);
        setIsVideoPlaying(false);
      }
    }
  };

  // Security: Prevent context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Utility functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: destination?.name || 'VR Experience',
        text: `Check out this amazing VR experience of ${destination?.name}!`,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // In a real app, this would call an API to save the favorite
  };

  if (!destination || !isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden">
        <div 
          ref={modalRef}
          className={`bg-black text-white transition-all duration-300 ${
            isFullscreenMode 
              ? 'w-full h-full' 
              : 'w-full max-w-7xl h-full max-h-[95vh] m-4 rounded-xl'
          }`}
          onContextMenu={handleContextMenu}
        >
          {/* Close Button */}
          {!isFullscreenMode && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Main Content */}
          <div className={`flex h-full ${
            isFullscreenMode ? 'flex-col' : 'flex-col lg:flex-row'
          }`}>
            
            {/* Video Player Section */}
            <div className={`relative bg-black ${
              isFullscreenMode 
                ? 'flex-1' 
                : 'w-full lg:w-2/3 xl:w-3/4'
            }`}>
              
              {/* Secure Video Player */}
              {hasVideos && currentVideo ? (
                <div className="relative w-full h-full">
                  <SecureVideoPlayer
                    youtubeId={currentVideo.youtubeId}
                    title={currentVideo.title}
                    description={currentVideo.description}
                    hasAccess={hasAccess}
                    previewDuration={60}
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onEnded={handleVideoEnded}
                    onError={handleVideoError}
                    onTimeUpdate={handleVideoTimeUpdate}
                    className="w-full h-full min-h-[300px] lg:min-h-[500px]"
                  />
                  
                  {/* Video Navigation */}
                  {videos.length > 1 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-40">
                      {videos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => changeVideo(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            index === currentVideoIndex
                              ? 'bg-red-600 scale-125'
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 z-40 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  >
                    {isFullscreenMode ? (
                      <Minimize className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize className="w-5 h-5 text-white" />
                    )}
                  </button>

                  {/* Premium Overlay */}
                  <AnimatePresence>
                    {!hasAccess && isPreviewExpired && (
                      <motion.div
                        className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="text-center text-white max-w-md px-6">
                          <Lock className="w-16 h-16 mx-auto mb-4 text-red-600" />
                          <h3 className="text-2xl font-bold mb-2">Unlock Full Experience</h3>
                          <p className="text-gray-300 mb-6 text-lg">
                            Continue exploring {destination.name} in stunning VR detail
                          </p>
                          <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 text-lg"
                          >
                            Upgrade to Premium - $4.99
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Preview Timer */}
                  <AnimatePresence>
                    {!hasAccess && previewTime > 0 && videoStarted && !isPreviewExpired && (
                      <motion.div
                        className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg z-40"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold">{previewTime}s preview</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* No Video State */
                <div className="flex items-center justify-center h-full min-h-[400px] text-white">
                  <div className="text-center">
                    {isVideoLoading ? (
                      <>
                        <div className="w-16 h-16 border-4 border-white/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xl font-medium">Loading Experience...</p>
                        <p className="text-gray-400 mt-2">Preparing your VR journey</p>
                      </>
                    ) : videoError ? (
                      <>
                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <X className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-xl font-medium text-red-500">Failed to Load</p>
                        <p className="text-gray-400 mt-2">Unable to load VR experience</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-xl font-medium">No VR Experience Available</p>
                        <p className="text-gray-400 mt-2">Check back later for new content</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar/Info Panel */}
            {!isFullscreenMode && (
              <div className="w-full lg:w-1/3 xl:w-1/4 bg-white flex flex-col overflow-hidden">
                
                {/* Video Title & Stats */}
                <div className="p-4 border-b border-gray-200">
                  <h1 className="text-lg font-bold text-gray-900 mb-1">
                    {destination.name} VR Experience
                  </h1>
                  
                  <div className="flex items-center space-x-4 text-gray-500 text-sm mb-3">
                    <span>{formatNumber(viewCount + parseInt(destination.visitors.replace(/[^0-9]/g, '') || '0'))} views</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{destination.rating}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mb-4">
                    <button
                      onClick={toggleFavorite}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                        isFavorited 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                      <span>{isFavorited ? 'Liked' : 'Like'}</span>
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    
                    <button
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Current Video Info */}
                  {hasVideos && currentVideo && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">Now Playing</h3>
                      <p className="text-gray-700 text-sm">{currentVideo.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{currentVideo.duration}</p>
                    </div>
                  )}
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                  
                  {/* Description */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">About This Experience</h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                      {destination.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Duration: {destination.duration}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">Protected Content</span>
                      </div>
                    </div>
                  </div>

                  {/* Video Playlist */}
                  {hasVideos && videos.length > 1 && (
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Video Playlist</h3>
                      <div className="space-y-2">
                        {videos.map((video, index) => (
                          <button
                            key={video.id}
                            onClick={() => changeVideo(index)}
                            className={`w-full text-left p-2 rounded-lg transition-all ${
                              index === currentVideoIndex
                                ? 'bg-red-50 border border-red-200'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 relative">
                                <div className="w-16 h-9 bg-gray-200 rounded flex items-center justify-center">
                                  {index === currentVideoIndex ? (
                                    <Play className="w-3 h-3 text-red-600 ml-0.5" />
                                  ) : (
                                    <div className={`w-2 h-2 rounded-full mt-1 ${
                                      index === currentVideoIndex ? 'bg-red-600' : 'bg-gray-400'
                                    }`} />
                                  )}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-black/80 text-white text-xs px-1 rounded">
                                  {video.duration}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${
                                  index === currentVideoIndex ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {video.title}
                                </p>
                                <p className="text-gray-500 text-xs mt-1 truncate">
                                  {video.description.substring(0, 40)}...
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Experience Highlights</h3>
                    <div className="space-y-2">
                      {destination.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Premium Features */}
                  {!hasAccess && (
                    <div className="p-4 bg-white">
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-red-600 mb-3 flex items-center space-x-2">
                          <Lock className="w-4 h-4" />
                          <span>Premium Features</span>
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            <span>Full 360° immersive experience</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            <span>High-resolution 4K quality</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            <span>Interactive hotspots & navigation</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            <span>Professional audio narration</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            <span>Unlimited access to all content</span>
                          </li>
                          {hasVideos && (
                            <li className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                              <span>All {videos.length} exclusive videos</span>
                            </li>
                          )}
                        </ul>
                        
                        <button
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2.5 px-4 rounded-lg font-semibold transition-all transform hover:scale-[1.02]"
                        >
                          Upgrade Now - $4.99
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  {hasAccess ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <Shield className="w-4 h-4" />
                      <span className="font-semibold text-sm">Premium Member</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-all text-sm"
                    >
                      Unlock Full Experience
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        destination={destination}
      />
    </>
  );
};

export default VRExperience;