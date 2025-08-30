import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlayerProvider, useVideoPlayer } from '../../context/VideoPlayerContext';
import EnhancedVideoControls from './EnhancedVideoControls';
import GestureLayer from './GestureLayer';
import ProgressiveLoader from './ProgressiveLoader';
import { generateCSSVariables, videoPlayerAnimations, videoPlayerClasses } from '../../utils/videoPlayerTheme';
import type { EnhancedVideoPlayerProps } from '../../types/videoPlayer';

// YouTube API type declarations
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const EnhancedVideoPlayerCore: React.FC<EnhancedVideoPlayerProps> = ({
  src,
  poster,
  title,
  description,
  duration,
  youtubeId,
  config,
  onProgress,
  onQualityChange,
  onInteraction,
  onPlay,
  onPause,
  onEnded,
  onError,
  onLoadStart,
  onLoadComplete,
  className = '',
  style,
}) => {
  const { state, actions, theme, refs } = useVideoPlayer();
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(!!(src || youtubeId));
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [apiReady, setApiReady] = useState(false);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<HTMLDivElement>(null);
  
  // Initialize YouTube API if needed
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
    if (apiReady && youtubeId && youtubePlayerRef.current && !player) {
      const initPlayer = () => {
        try {
          const newPlayer = new window.YT.Player(youtubePlayerRef.current, {
            height: '100%',
            width: '100%',
            videoId: youtubeId,
            playerVars: {
              autoplay: config?.autoplay ? 1 : 0,
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
                setIsLoading(false);
                setHasError(false);
                setPlayer(newPlayer);
                refs.videoRef.current = newPlayer;
                refs.playerRef.current = playerContainerRef.current;
                onLoadComplete?.();
                
                // Update duration
                const videoDuration = newPlayer.getDuration();
                if (videoDuration) {
                  actions.setDuration?.(videoDuration);
                }
              },
              onStateChange: (event: any) => {
                const state = event.data;
                if (state === window.YT.PlayerState.PLAYING) {
                  actions.setPlaying?.(true);
                  onPlay?.();
                } else if (state === window.YT.PlayerState.PAUSED) {
                  actions.setPaused?.(true);
                  onPause?.();
                } else if (state === window.YT.PlayerState.ENDED) {
                  actions.setPlaying?.(false);
                  onEnded?.();
                } else if (state === window.YT.PlayerState.BUFFERING) {
                  actions.setBuffering?.(true);
                }
              },
              onError: (event: any) => {
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
  }, [apiReady, youtubeId, player, config, refs.videoRef, actions, onPlay, onPause, onEnded, onError, onLoadComplete]);
  
  // Handle regular video src (HTML5)
  useEffect(() => {
    if (src && !youtubeId && refs.videoRef.current) {
      const videoElement = refs.videoRef.current as HTMLVideoElement;
      
      const handleLoadStart = () => {
        setIsLoading(true);
        onLoadStart?.();
      };
      
      const handleCanPlay = () => {
        setIsLoading(false);
        onLoadComplete?.();
      };
      
      const handleError = () => {
        setHasError(true);
        setErrorMessage('Failed to load video');
        setIsLoading(false);
        onError?.('Failed to load video');
      };
      
      const handleTimeUpdate = () => {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        actions.setCurrentTime?.(currentTime);
        if (!isNaN(duration)) {
          actions.setDuration?.(duration);
        }
        onProgress?.(currentTime / duration);
      };
      
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [src, youtubeId, refs.videoRef, actions, onProgress, onError, onLoadStart, onLoadComplete]);
  
  // Progress tracking for YouTube
  useEffect(() => {
    if (player && youtubeId) {
      const interval = setInterval(() => {
        try {
          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();
          
          if (currentTime !== undefined && duration !== undefined) {
            actions.setCurrentTime?.(currentTime);
            onProgress?.(currentTime / duration);
          }
        } catch (error) {
          // Player might not be ready
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [player, youtubeId, actions, onProgress]);
  
  // Auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    if (!state.isPaused) {
      setShowControls(false);
    }
  }, [state.isPaused]);
  
  // Error retry handler
  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    
    if (youtubeId && player) {
      try {
        player.destroy();
        setPlayer(null);
        setApiReady(false);
        // Re-initialize
        setTimeout(() => setApiReady(true), 100);
      } catch (error) {
        console.error('Error retrying video:', error);
      }
    }
  }, [youtubeId, player]);
  
  return (
    <div
      ref={playerContainerRef}
      className={`${videoPlayerClasses.container} ${className}`}
      style={{
        ...style,
        ...{ '--theme-vars': generateCSSVariables(theme) } as any,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Container */}
      <div className="relative w-full h-full">
        {/* YouTube Player */}
        {youtubeId && (
          <div
            ref={youtubePlayerRef}
            className="w-full h-full"
            style={{
              opacity: isLoading || hasError ? 0 : 1,
              transition: 'opacity 0.3s ease-out',
            }}
          />
        )}
        
        {/* HTML5 Video */}
        {src && !youtubeId && (
          <video
            ref={(el) => {
              refs.videoRef.current = el;
              refs.playerRef.current = playerContainerRef.current;
            }}
            className="w-full h-full object-cover"
            poster={poster}
            preload={config?.preload || 'metadata'}
            playsInline={config?.playsInline}
            crossOrigin={config?.crossOrigin}
            loop={config?.loop}
            style={{
              opacity: isLoading || hasError ? 0 : 1,
              transition: 'opacity 0.3s ease-out',
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
        
        {/* Progressive Loader */}
        <AnimatePresence>
          {isLoading && (
            <ProgressiveLoader
              src={typeof src === 'string' ? src : Array.isArray(src) ? src.map(s => typeof s === 'string' ? s : s.url) : ''}
              youtubeId={youtubeId}
              poster={poster}
              onLoadStart={onLoadStart}
              onLoadComplete={onLoadComplete}
              onError={onError}
            />
          )}
        </AnimatePresence>
        
        {/* Error State */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
              variants={videoPlayerAnimations.fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="text-center text-white max-w-sm px-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Playback Error</h3>
                <p className="text-gray-300 mb-4">{errorMessage}</p>
                <button
                  onClick={handleRetry}
                  className={videoPlayerClasses.primaryButton}
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Gesture Layer for Mobile */}
        <GestureLayer
          className="absolute inset-0"
          disabled={!config?.gestures || hasError || isLoading}
          onGesture={onInteraction ? (gesture) => onInteraction({
            type: 'gesture',
            timestamp: Date.now(),
            data: gesture,
          }) : undefined}
        >
          <div className="w-full h-full" />
        </GestureLayer>
        
        {/* Video Info Overlay */}
        <AnimatePresence>
          {showControls && (title || description) && !hasError && !isLoading && (
            <motion.div
              className="absolute top-4 left-4 right-4 z-30"
              variants={videoPlayerAnimations.slideDown}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className={`${videoPlayerClasses.glass} p-4`}>
                {title && (
                  <h3 className={videoPlayerClasses.title}>{title}</h3>
                )}
                {description && (
                  <p className={videoPlayerClasses.subtitle}>{description}</p>
                )}
                {duration && (
                  <p className={videoPlayerClasses.caption}>Duration: {duration}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Enhanced Controls */}
        <EnhancedVideoControls
          showControls={showControls && !hasError && !isLoading}
          onShowControlsChange={setShowControls}
        />
      </div>
    </div>
  );
};

// Main component with provider
const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = (props) => {
  return (
    <VideoPlayerProvider
      config={props.config}
      theme={props.config?.theme}
      onInteraction={props.onInteraction}
    >
      <EnhancedVideoPlayerCore {...props} />
    </VideoPlayerProvider>
  );
};

export default EnhancedVideoPlayer;