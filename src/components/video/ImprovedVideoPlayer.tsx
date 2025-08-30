import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, PictureInPicture, RotateCcw, Keyboard, X } from 'lucide-react';

// YouTube API type declarations
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface ImprovedVideoPlayerProps {
  src?: string | string[];
  poster?: string;
  title?: string;
  description?: string;
  duration?: string;
  youtubeId?: string;
  autoplay?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ImprovedVideoPlayer: React.FC<ImprovedVideoPlayerProps> = ({
  src,
  poster,
  title,
  description,
  duration,
  youtubeId,
  autoplay = false,
  controls = true,
  onPlay,
  onPause,
  onEnded,
  onError,
  onLoadStart,
  onLoadComplete,
  onProgress,
  className = '',
  style,
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(!!youtubeId);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState('auto');
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [hasShownShortcuts, setHasShownShortcuts] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const youtubeContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const playerIdRef = useRef<string>(`youtube-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Control handlers - Define these first before using them in useEffect
  const handlePlayPause = useCallback(() => {
    if (youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pauseVideo();
      } else {
        youtubePlayer.playVideo();
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying, youtubePlayer]);

  const handleSeek = useCallback((time: number) => {
    if (youtubePlayer) {
      youtubePlayer.seekTo(time);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, [youtubePlayer]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (youtubePlayer) {
      youtubePlayer.setVolume(newVolume * 100);
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, [youtubePlayer]);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (youtubePlayer) {
      if (newMuted) {
        youtubePlayer.mute();
      } else {
        youtubePlayer.unMute();
      }
    } else if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  }, [isMuted, youtubePlayer]);

  const handleFullscreenToggle = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [isFullscreen]);

  const handlePictureInPicture = useCallback(async () => {
    if (!videoRef.current || !isPipSupported) return;

    try {
      if (!isPipActive) {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      } else {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  }, [isPipActive, isPipSupported]);

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
      }
    }
  }, [isLandscape]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Check PiP support
  useEffect(() => {
    if (videoRef.current && 'requestPictureInPicture' in videoRef.current) {
      setIsPipSupported(true);
    }
  }, []);

  // Show keyboard shortcuts on first interaction
  useEffect(() => {
    if (playerReady && !hasShownShortcuts) {
      const timer = setTimeout(() => {
        setShowKeyboardShortcuts(true);
        setHasShownShortcuts(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [playerReady, hasShownShortcuts]);

  // Orientation detection
  useEffect(() => {
    const handleOrientationChange = () => {
      const orientation = screen.orientation?.type || window.orientation;
      const newIsLandscape = 
        orientation === 'landscape-primary' || 
        orientation === 'landscape-secondary' || 
        Math.abs(Number(orientation)) === 90;
      
      setIsLandscape(newIsLandscape);
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  // YouTube API initialization
  useEffect(() => {
    if (youtubeId && !window.YT) {
      const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
          setApiReady(true);
          return;
        }
        
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        (window as any).onYouTubeIframeAPIReady = () => {
          setApiReady(true);
        };
      };
      
      loadYouTubeAPI();
    } else if (youtubeId && window.YT) {
      setApiReady(true);
    }
  }, [youtubeId]);

  // Initialize YouTube player
  useEffect(() => {
    if (apiReady && youtubeId && youtubeContainerRef.current && !youtubePlayer) {
      const initPlayer = () => {
        try {
          // Set the ID for the YouTube container
          youtubeContainerRef.current!.id = playerIdRef.current;
          
          const newPlayer = new window.YT.Player(playerIdRef.current, {
            height: '100%',
            width: '100%',
            videoId: youtubeId,
            playerVars: {
              autoplay: autoplay ? 1 : 0,
              controls: 0, // We'll use custom controls
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 1,
              cc_load_policy: 0,
              iv_load_policy: 3,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: (event: any) => {
                console.log('YouTube player ready');
                setIsLoading(false);
                setHasError(false);
                setYoutubePlayer(newPlayer);
                setPlayerReady(true);
                onLoadComplete?.();
                
                // Update duration
                const duration = newPlayer.getDuration();
                if (duration) {
                  setVideoDuration(duration);
                }
              },
              onStateChange: (event: any) => {
                const state = event.data;
                console.log('YouTube player state change:', state);
                if (state === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  setIsPaused(false);
                  onPlay?.();
                } else if (state === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  setIsPaused(true);
                  onPause?.();
                } else if (state === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  setIsPaused(false);
                  onEnded?.();
                }
              },
              onError: (event: any) => {
                console.error('YouTube player error:', event);
                setHasError(true);
                setErrorMessage('Video playback error');
                setIsLoading(false);
                onError?.('Video playback error');
              },
            },
          });
        } catch (error) {
          console.error('Failed to initialize YouTube player:', error);
          setHasError(true);
          setErrorMessage('Failed to initialize video player');
          setIsLoading(false);
          onError?.('Failed to initialize video player');
        }
      };
      
      const timer = setTimeout(initPlayer, 100);
      return () => clearTimeout(timer);
    }
  }, [apiReady, youtubeId, youtubePlayer, autoplay, onPlay, onPause, onEnded, onError, onLoadComplete]);

  // Progress tracking for YouTube
  useEffect(() => {
    if (youtubePlayer && youtubeId && playerReady) {
      const interval = setInterval(() => {
        try {
          const current = youtubePlayer.getCurrentTime();
          const duration = youtubePlayer.getDuration();
          
          if (current !== undefined && duration !== undefined) {
            setCurrentTime(current);
            onProgress?.(current / duration);
          }
        } catch (error) {
          // Player might not be ready
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [youtubePlayer, youtubeId, onProgress, playerReady]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying && !isPaused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying, isPaused]);

  // YouTube-style keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys when the video player is focused or visible
      if (!containerRef.current || document.activeElement?.tagName === 'INPUT') return;

      // Show shortcuts toast on first keyboard interaction
      if (!hasShownShortcuts) {
        setShowKeyboardShortcuts(true);
        setHasShownShortcuts(true);
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          handleSeek(Math.min(videoDuration, currentTime + 10));
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreenToggle();
          break;
        case 'i':
          e.preventDefault();
          if (isPipSupported) {
            handlePictureInPicture();
          }
          break;
        case 'c':
          e.preventDefault();
          // Toggle captions (if available)
          break;
        case ',':
          e.preventDefault();
          // Previous frame (when paused)
          if (isPaused) {
            handleSeek(Math.max(0, currentTime - 1/30));
          }
          break;
        case '.':
          e.preventDefault();
          // Next frame (when paused)
          if (isPaused) {
            handleSeek(Math.min(videoDuration, currentTime + 1/30));
          }
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percentage = parseInt(e.key) / 10;
          handleSeek(videoDuration * percentage);
          break;
        case 'home':
          e.preventDefault();
          handleSeek(0);
          break;
        case 'end':
          e.preventDefault();
          handleSeek(videoDuration);
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(true);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    videoDuration,
    volume,
    isPaused,
    isPlaying,
    isPipSupported,
    hasShownShortcuts,
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
    handleMuteToggle,
    handleFullscreenToggle,
    handlePictureInPicture,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden focus:outline-none ${className}`}
      style={style}
      onClick={() => setShowControls(!showControls)}
      tabIndex={0}
    >
      {/* YouTube Player */}
      {youtubeId && (
        <div
          ref={youtubeContainerRef}
          className="w-full h-full"
          style={{
            display: hasError ? 'none' : 'block',
          }}
        />
      )}
      
      {/* HTML5 Video */}
      {src && !youtubeId && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          poster={poster}
          preload="metadata"
          playsInline
          onPlay={() => {
            setIsPlaying(true);
            setIsPaused(false);
            setIsLoading(false);
            onPlay?.();
          }}
          onPause={() => {
            setIsPlaying(false);
            setIsPaused(true);
            onPause?.();
          }}
          onEnded={() => {
            setIsPlaying(false);
            setIsPaused(false);
            onEnded?.();
          }}
          onTimeUpdate={(e) => {
            const current = e.currentTarget.currentTime;
            const duration = e.currentTarget.duration;
            setCurrentTime(current);
            onProgress?.(current / duration);
          }}
          onLoadedMetadata={(e) => {
            setVideoDuration(e.currentTarget.duration);
            setIsLoading(false);
            onLoadComplete?.();
          }}
          onLoadStart={() => {
            setIsLoading(true);
            onLoadStart?.();
          }}
          onError={() => {
            setHasError(true);
            setErrorMessage('Failed to load video');
            setIsLoading(false);
            onError?.('Failed to load video');
          }}
          onEnterpictureinpicture={() => setIsPipActive(true)}
          onLeavepictureinpicture={() => setIsPipActive(false)}
          style={{
            display: hasError ? 'none' : 'block',
          }}
        >
          {Array.isArray(src) ? (
            src.map((source, index) => (
              <source key={index} src={source} />
            ))
          ) : (
            <source src={src} />
          )}
        </video>
      )}

      {/* Loading State - Only show during initial load */}
      <AnimatePresence>
        {isLoading && !playerReady && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading Video...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Playback Error</h3>
              <p className="text-gray-300 mb-4">{errorMessage}</p>
              <button
                onClick={() => {
                  setHasError(false);
                  setErrorMessage('');
                  setIsLoading(true);
                  setPlayerReady(false);
                  if (youtubePlayer) {
                    youtubePlayer.destroy();
                    setYoutubePlayer(null);
                    setApiReady(false);
                    setTimeout(() => setApiReady(true), 100);
                  }
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Toast */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20 z-50 max-w-sm"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Keyboard className="w-5 h-5 text-orange-400" />
                <h4 className="font-medium">Keyboard Shortcuts</h4>
              </div>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">Play/Pause</span>
                  <span className="text-orange-400 font-mono">Space</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Seek ±10s</span>
                  <span className="text-orange-400 font-mono">J / L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Volume</span>
                  <span className="text-orange-400 font-mono">↑ / ↓</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">Mute</span>
                  <span className="text-orange-400 font-mono">M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Fullscreen</span>
                  <span className="text-orange-400 font-mono">F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Seek to %</span>
                  <span className="text-orange-400 font-mono">0-9</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Info Overlay */}
      <AnimatePresence>
        {showControls && (title || description) && !hasError && !isLoading && (
          <motion.div
            className="absolute top-4 left-4 right-4 z-30"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg">
              {title && (
                <h3 className="text-lg font-bold mb-1">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-gray-300 mb-2">{description}</p>
              )}
              {duration && (
                <p className="text-xs text-gray-400">Duration: {duration}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && !hasError && controls && (
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm z-20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {/* Progress Bar */}
            <div className="px-4 pb-2">
              <div
                className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  const newTime = percentage * videoDuration;
                  handleSeek(newTime);
                }}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  style={{
                    width: `${(currentTime / videoDuration) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    left: `${(currentTime / videoDuration) * 100}%`,
                    marginLeft: '-8px',
                  }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between px-4 py-3">
              {/* Left Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Play/Pause (Space or K)"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Rewind 10s (J or ←)"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => handleSeek(Math.min(videoDuration, currentTime + 10))}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Forward 10s (L or →)"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={handleMuteToggle}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Mute/Unmute (M)"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                <div className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Keyboard Shortcuts (?)"
                >
                  <Keyboard className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={handleRotateScreen}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Rotate Screen"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>

                {isPipSupported && !youtubeId && (
                  <button
                    onClick={handlePictureInPicture}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Picture in Picture (I)"
                  >
                    <PictureInPicture className="w-5 h-5 text-white" />
                  </button>
                )}

                <button
                  onClick={handleFullscreenToggle}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Menu */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="absolute bottom-20 right-4 p-4 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 min-w-48 z-30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {/* Quality Settings */}
            <div className="mb-4">
              <h4 className="text-white text-sm font-medium mb-2">Quality</h4>
              <div className="space-y-1">
                {['auto', '480p', '720p', '1080p'].map((quality) => (
                  <button
                    key={quality}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      videoQuality === quality
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setVideoQuality(quality);
                      setShowSettings(false);
                    }}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Speed Settings */}
            <div className="mb-4">
              <h4 className="text-white text-sm font-medium mb-2">Speed</h4>
              <div className="space-y-1">
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                  <button
                    key={speed}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setPlaybackSpeed(speed);
                      if (youtubePlayer) {
                        youtubePlayer.setPlaybackRate(speed);
                      } else if (videoRef.current) {
                        videoRef.current.playbackRate = speed;
                      }
                      setShowSettings(false);
                    }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts Help */}
            <div className="pt-4 border-t border-white/20">
              <h4 className="text-white text-sm font-medium mb-2">More Shortcuts</h4>
              <div className="space-y-1 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>Frame by frame</span>
                  <span>, / .</span>
                </div>
                <div className="flex justify-between">
                  <span>Start/End</span>
                  <span>Home/End</span>
                </div>
                <div className="flex justify-between">
                  <span>Show shortcuts</span>
                  <span>?</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImprovedVideoPlayer;