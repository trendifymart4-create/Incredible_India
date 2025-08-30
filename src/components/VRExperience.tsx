import React, { useState, useEffect, useRef } from 'react';
import { Play, Lock, Star, Clock, X, Maximize, Minimize } from 'lucide-react';
import type { Destination } from './Destinations';
import PaymentModal from './PaymentModal';
import { getVideosByDestination, type Video } from '../api/videos';

// YouTube API type declarations
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VRExperienceProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

const VRExperience: React.FC<VRExperienceProps> = ({ destination, isOpen, onClose }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [previewTime, setPreviewTime] = useState(60); // 1 minute preview
  const [isPreviewExpired, setIsPreviewExpired] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLIFrameElement | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Derived state - calculate after videos state is defined
  const currentVideo = videos[currentVideoIndex];
  const hasVideos = videos.length > 0;
  
  // Browser fullscreen helper functions
  const enterFullscreen = (element: HTMLElement) => {
    try {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).mozRequestFullScreen) { // Firefox
        (element as any).mozRequestFullScreen();
      } else if ((element as any).webkitRequestFullscreen) { // Chrome, Safari and Opera
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) { // IE/Edge
        (element as any).msRequestFullscreen();
      }
      setIsBrowserFullscreen(true);
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) { // Firefox
        (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) { // Chrome, Safari and Opera
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) { // IE/Edge
        (document as any).msExitFullscreen();
      }
      setIsBrowserFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };
  
  // YouTube API loading effect
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        setApiReady(true);
        return;
      }
      
      // Load YouTube API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Setup callback for when API is ready
      (window as any).onYouTubeIframeAPIReady = () => {
        setApiReady(true);
      };
    };
    
    loadYouTubeAPI();
  }, []);

  // Initialize YouTube player when API is ready and video changes
  useEffect(() => {
    if (apiReady && currentVideo && hasVideos && !videoError) {
      const initPlayer = () => {
        try {
          // Clear any existing player
          if (player) {
            player.destroy();
          }
          
          // Create new player
          const newPlayer = new (window as any).YT.Player(`youtube-player-${currentVideo.youtubeId}`, {
            height: '100%',
            width: '100%',
            videoId: currentVideo.youtubeId,
            playerVars: {
              autoplay: 0,
              controls: hasAccess ? 1 : 0,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: hasAccess ? 1 : 0,
              cc_load_policy: 0,
              iv_load_policy: 3,
              disablekb: !hasAccess ? 1 : 0,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin
            },
            events: {
              onReady: (event: any) => {
                setIsVideoLoading(false);
                setVideoError(false);
                setPlayer(newPlayer);
              },
              onStateChange: (event: any) => {
                const state = event.data;
                if (state === (window as any).YT.PlayerState.PLAYING) {
                  setIsVideoPlaying(true);
                  setIsPaused(false);
                  if (!videoStarted) {
                    setVideoStarted(true);
                  }
                } else if (state === (window as any).YT.PlayerState.PAUSED) {
                  setIsVideoPlaying(false);
                  setIsPaused(true);
                } else if (state === (window as any).YT.PlayerState.ENDED) {
                  setIsVideoPlaying(false);
                  setIsPaused(false);
                }
              },
              onError: () => {
                setVideoError(true);
                setIsVideoLoading(false);
              }
            }
          });
        } catch (error) {
          console.error('Failed to initialize YouTube player:', error);
          setVideoError(true);
          setIsVideoLoading(false);
        }
      };
      
      // Small delay to ensure DOM is ready
      const timer = setTimeout(initPlayer, 100);
      return () => clearTimeout(timer);
    }
  }, [apiReady, currentVideo, hasVideos, videoError, hasAccess]);

  // Clean up player on unmount or video change
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
      }
    };
  }, [currentVideoIndex]);

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


  // Preview timer effect - only countdown when video is actually playing and not paused
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && !hasAccess && previewTime > 0 && hasVideos && !videoError && !isVideoLoading && isVideoPlaying && videoStarted && !isPaused) {
      timer = setInterval(() => {
        setPreviewTime((prev) => {
          if (prev <= 1) {
            setIsPreviewExpired(true);
            // Stop the playback when preview expires
            if (player) {
              try {
                player.pauseVideo();
              } catch (error) {
                console.error('Error pausing video on preview expiry:', error);
              }
            }
            setIsVideoPlaying(false);
            setIsPaused(false);
            // Exit browser fullscreen when preview expires
            if (isBrowserFullscreen) {
              exitFullscreen();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, hasAccess, previewTime, hasVideos, videoError, isVideoLoading, player, isVideoPlaying, videoStarted, isPaused]);

  // Reset video state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setVideoError(false);
      // Only set loading state if we don't have videos loaded
      if (videos.length === 0) {
        setIsVideoLoading(true);
      }
      setCurrentVideoIndex(0);
      setPreviewTime(60); // Reset to 1 minute
      setIsPreviewExpired(false);
      setIsVideoPlaying(false);
      setVideoStarted(false);
      setIsPaused(false);
    }
  }, [isOpen, videos.length]);

  // Handle video load
  const handleVideoLoad = () => {
    // Video loading is now handled by YouTube API events
  };

  // Handle video error
  const handleVideoError = () => {
    // Video errors are now handled by YouTube API events
  };

  // Exit fullscreen when modal is closed
  useEffect(() => {
    if (!isOpen && isBrowserFullscreen) {
      exitFullscreen();
    }
  }, [isOpen, isBrowserFullscreen]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;
      
      setIsBrowserFullscreen(!!isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handlePaymentSuccess = () => {
    setHasAccess(true);
    setIsPaymentModalOpen(false);
    setPreviewTime(0); // Reset preview timer
    setIsPreviewExpired(false);
    
    // Refresh the player with premium controls
    if (player) {
      try {
        player.destroy();
        setPlayer(null);
      } catch (error) {
        console.error('Error destroying player after payment:', error);
      }
    }
  };

  const changeVideo = (index: number) => {
    // Don't allow video changes if preview expired and no access
    if (!hasAccess && isPreviewExpired) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    setCurrentVideoIndex(index);
    setVideoError(false);
    setIsVideoLoading(true);
    setPreviewTime(60); // Reset preview timer for new video
    setIsPreviewExpired(false);
    setIsVideoPlaying(false);
    setVideoStarted(false);
    setIsPaused(false);
    
    // Destroy existing player to force reload
    if (player) {
      try {
        player.destroy();
        setPlayer(null);
      } catch (error) {
        console.error('Error destroying player:', error);
      }
    }
  };

  const openFullscreen = () => {
    // Only allow fullscreen for premium users
    if (!hasAccess) {
      setIsPaymentModalOpen(true);
      return;
    }
    
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
    
    // Initialize fullscreen player
    if (apiReady && currentVideo) {
      setTimeout(() => {
        try {
          const fullscreenPlayer = new (window as any).YT.Player(`youtube-player-fullscreen-${currentVideo.youtubeId}`, {
            height: '100%',
            width: '100%',
            videoId: currentVideo.youtubeId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
              enablejsapi: 1,
              origin: window.location.origin
            }
          });
        } catch (error) {
          console.error('Failed to initialize fullscreen player:', error);
        }
      }, 100);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'unset';
  };

  if (!destination || !isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{destination.name}</h2>
              <p className="text-gray-600 flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{destination.rating} • {destination.location}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* VR Player */}
          <div
            ref={videoContainerRef}
            className="relative aspect-video bg-gray-900"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {hasVideos && currentVideo ? (
              <>
                {/* Loading State */}
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading Video...</p>
                    </div>
                  </div>
                )}

                {/* Video Error State */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white max-w-md px-6">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Embedding Restricted</h3>
                      <p className="text-gray-300 mb-4">
                        This video cannot be embedded due to YouTube's restrictions. You can watch it directly on YouTube.
                      </p>
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            setVideoError(false);
                            setIsVideoLoading(true);
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube Player Container */}
                {!videoError && currentVideo?.youtubeId && (
                  <>
                    <div
                      className="relative w-full h-full"
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    >
                      {/* YouTube API Player */}
                      <div
                        id={`youtube-player-${currentVideo.youtubeId}`}
                        className={`w-full h-full ${isVideoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                        style={{
                          pointerEvents: hasAccess ? 'auto' : 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                      />
                      
                      {/* Secure overlay for free users */}
                      {!hasAccess && (
                        <div 
                          className="absolute inset-0 bg-transparent"
                          onContextMenu={(e) => e.preventDefault()}
                          style={{ 
                            pointerEvents: 'auto', 
                            zIndex: 20,
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        />
                      )}
                      
                      {/* Click overlay to start video and detect play state */}
                      {(!isVideoPlaying || isPaused) && !isPreviewExpired && (
                        <div 
                          className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors"
                          onClick={() => {
                            if (player) {
                              try {
                                if (!videoStarted) {
                                  setVideoStarted(true);
                                }
                                player.playVideo();
                                // Enter browser fullscreen when video plays
                                if (videoContainerRef.current) {
                                  enterFullscreen(videoContainerRef.current);
                                }
                              } catch (error) {
                                console.error('Error playing video:', error);
                              }
                            }
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                          style={{ zIndex: 30 }}
                        >
                          <div className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full transition-colors shadow-lg">
                            <Play className="w-8 h-8 ml-1" />
                          </div>
                        </div>
                      )}
                      
                      {/* Pause button overlay - visible when video is playing */}
                      {isVideoPlaying && !isPaused && !isPreviewExpired && (
                        <div className="absolute inset-0" style={{ zIndex: 25 }}>
                          <button
                            onClick={() => {
                              if (player) {
                                try {
                                  player.pauseVideo();
                                  // Exit browser fullscreen when video is paused
                                  if (isBrowserFullscreen) {
                                    exitFullscreen();
                                  }
                                } catch (error) {
                                  console.error('Error pausing video:', error);
                                }
                              }
                            }}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                            style={{ backdropFilter: 'blur(4px)' }}
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      {/* Custom video controls for premium users */}
                      {hasAccess && isVideoPlaying && (
                        <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => {
                                if (player) {
                                  try {
                                    if (isVideoPlaying) {
                                      player.pauseVideo();
                                    } else {
                                      player.playVideo();
                                    }
                                  } catch (error) {
                                    console.error('Error controlling video:', error);
                                  }
                                }
                              }}
                              className="text-white hover:text-orange-400 transition-colors"
                            >
                              {isVideoPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                </svg>
                              ) : (
                                <Play className="w-6 h-6" />
                              )}
                            </button>
                            <div className="flex-1 bg-gray-600 h-1 rounded-full">
                              <div className="bg-orange-500 h-1 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                            <span className="text-white text-sm">{currentVideo.duration}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Video Info Overlay */}
                {!videoError && (
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium">{currentVideo.title}</p>
                    <p className="text-xs text-gray-300">{currentVideo.duration}</p>
                  </div>
                )}

                {/* Fullscreen Button - Premium Only */}
                {hasVideos && currentVideo && !videoError && hasAccess && (
                  <button
                    onClick={openFullscreen}
                    className="absolute top-4 right-16 bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-all"
                    title="Open Fullscreen"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                )}

                {/* Video Navigation */}
                {videos.length > 1 && !videoError && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
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
                  </div>
                )}
              </>
            ) : (
              /* Fallback when no videos or loading */
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                <div className="text-center text-white">
                  {isVideoLoading ? (
                    <>
                      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg font-medium">Loading Videos...</p>
                      <p className="text-sm text-gray-300 mt-2">
                        Fetching videos from Firebase...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-lg font-medium">No VR Experience Available</p>
                      <p className="text-sm text-gray-300 mt-2">
                        Please add videos through the admin panel to enable VR experiences for this destination.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Preview Overlay */}
            {!hasAccess && previewTime <= 0 && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white max-w-md px-6">
                  <Lock className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                  <h3 className="text-2xl font-bold mb-2">Unlock Full Experience</h3>
                  <p className="text-gray-300 mb-6">
                    Continue exploring {destination.name} in stunning 360° detail
                  </p>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    Unlock for $4.99
                  </button>
                </div>
              </div>
            )}

            {/* Preview Timer */}
            {!hasAccess && previewTime > 0 && hasVideos && !videoError && videoStarted && (
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                <p className="text-sm flex items-center space-x-2">
                  <span>Preview: {previewTime}s</span>
                  {isPaused && (
                    <span className="text-orange-400 text-xs">(Paused)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">About This Experience</h3>
                <p className="text-gray-600 mb-4">{destination.description}</p>
                
                {hasVideos && currentVideo && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Current Video</h4>
                    <p className="text-sm text-blue-700">{currentVideo.description}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Duration: {destination.duration}</span>
                  </div>
                  {hasVideos && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Play className="w-4 h-4" />
                      <span>{videos.length} video{videos.length !== 1 ? 's' : ''} available</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Highlights */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Experience Highlights</h3>
                <div className="space-y-2">
                  {destination.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* Video List */}
                {hasVideos && videos.length > 1 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Available Videos</h4>
                    <div className="space-y-2">
                      {videos.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => changeVideo(index)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            index === currentVideoIndex
                              ? 'bg-orange-50 border border-orange-200'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <p className="font-medium text-sm">{video.title}</p>
                          <p className="text-xs text-gray-500">{video.duration}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!hasAccess && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Premium Features</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
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
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {!hasAccess ? (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Unlock Full Experience - $4.99
                </button>
              ) : (
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
                  Enjoy Your VR Experience
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal - Premium Only */}
      {isFullscreen && hasVideos && currentVideo && hasAccess && (
        <div className="fixed inset-0 bg-black z-[70] flex items-center justify-center animate-fade-in">
          {/* Control Buttons */}
          <div className="absolute top-6 right-6 z-[71] flex space-x-2">
            {/* Exit Fullscreen Button */}
            <button
              onClick={closeFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
              title="Exit Fullscreen"
            >
              <Minimize className="w-6 h-6" />
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Video Title Overlay */}
          <div className="absolute top-6 left-6 z-[71] bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
            <h3 className="text-lg font-semibold">{destination?.name}</h3>
            <p className="text-sm text-gray-300">{currentVideo.title}</p>
          </div>

          {/* Protected Fullscreen Video Container */}
          <div className="w-full h-full max-w-none max-h-none p-6">
            <div className="relative w-full h-full">
              <div
                id={`youtube-player-fullscreen-${currentVideo.youtubeId}`}
                className="w-full h-full rounded-lg"
              />
            </div>
          </div>

          {/* Video Navigation in Fullscreen */}
          {videos.length > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[71] flex space-x-2">
              {videos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => changeVideo(index)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    index === currentVideoIndex
                      ? 'bg-orange-500 text-white'
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  {video.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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