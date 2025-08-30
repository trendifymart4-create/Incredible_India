import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';
import type {
  VideoPlayerContextType,
  VideoPlayerState,
  VideoPlayerConfig,
  VideoPlayerTheme,
  InteractionEvent,
  GestureEvent,
} from '../types/videoPlayer';
import { defaultVideoPlayerTheme } from '../utils/videoPlayerTheme';

// Initial state
const initialState: VideoPlayerState = {
  isPlaying: false,
  isPaused: false,
  isLoading: true,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  quality: 'auto',
  speed: 1,
  isFullscreen: false,
  isPictureInPicture: false,
  hasError: false,
  errorMessage: undefined,
  bufferedRanges: null,
};

// Default config
const defaultConfig: VideoPlayerConfig = {
  autoplay: false,
  controls: true,
  quality: 'auto',
  speed: 1,
  chapters: [],
  overlays: [],
  gestures: true,
  pip: true,
  analytics: true,
  preload: 'metadata',
  playsInline: true,
  loop: false,
  theme: defaultVideoPlayerTheme,
};

// Action types
type VideoPlayerAction =
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BUFFERING'; payload: boolean }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_QUALITY'; payload: string }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_PICTURE_IN_PICTURE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { hasError: boolean; errorMessage?: string } }
  | { type: 'SET_BUFFERED_RANGES'; payload: TimeRanges | null }
  | { type: 'RESET' };

// Reducer
const videoPlayerReducer = (state: VideoPlayerState, action: VideoPlayerAction): VideoPlayerState => {
  switch (action.type) {
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload, isPaused: !action.payload };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload, isPlaying: !action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_BUFFERING':
      return { ...state, isBuffering: action.payload };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_QUALITY':
      return { ...state, quality: action.payload };
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    case 'SET_PICTURE_IN_PICTURE':
      return { ...state, isPictureInPicture: action.payload };
    case 'SET_ERROR':
      return { ...state, hasError: action.payload.hasError, errorMessage: action.payload.errorMessage };
    case 'SET_BUFFERED_RANGES':
      return { ...state, bufferedRanges: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
};

// Context
const VideoPlayerContext = createContext<VideoPlayerContextType | null>(null);

// Provider Props
interface VideoPlayerProviderProps {
  children: React.ReactNode;
  config?: Partial<VideoPlayerConfig>;
  theme?: Partial<VideoPlayerTheme>;
  onInteraction?: (event: InteractionEvent) => void;
  onGesture?: (event: GestureEvent) => void;
}

// Provider Component
export const VideoPlayerProvider: React.FC<VideoPlayerProviderProps> = ({
  children,
  config: configOverride = {},
  theme: themeOverride = {},
  onInteraction,
  onGesture,
}) => {
  const [state, dispatch] = useReducer(videoPlayerReducer, initialState);
  
  // Merge configs and themes
  const config = { ...defaultConfig, ...configOverride };
  const theme = { ...defaultVideoPlayerTheme, ...config.theme, ...themeOverride };
  
  // Refs
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | any>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  
  // Track interaction events
  const trackInteraction = useCallback((event: InteractionEvent) => {
    onInteraction?.(event);
    
    // Analytics tracking
    if (config.analytics) {
      console.log('Video Player Interaction:', event);
    }
  }, [onInteraction, config.analytics]);
  
  // Actions
  const actions = {
    play: useCallback(() => {
      if (videoRef.current) {
        if (videoRef.current.playVideo) {
          // YouTube player
          videoRef.current.playVideo();
        } else if (videoRef.current.play) {
          // HTML5 video
          videoRef.current.play();
        }
        
        trackInteraction({
          type: 'play',
          timestamp: Date.now(),
          data: { currentTime: state.currentTime },
        });
      }
    }, [state.currentTime, trackInteraction]),
    
    pause: useCallback(() => {
      if (videoRef.current) {
        if (videoRef.current.pauseVideo) {
          // YouTube player
          videoRef.current.pauseVideo();
        } else if (videoRef.current.pause) {
          // HTML5 video
          videoRef.current.pause();
        }
        
        trackInteraction({
          type: 'pause',
          timestamp: Date.now(),
          data: { currentTime: state.currentTime },
        });
      }
    }, [state.currentTime, trackInteraction]),
    
    seek: useCallback((time: number) => {
      if (videoRef.current) {
        if (videoRef.current.seekTo) {
          // YouTube player
          videoRef.current.seekTo(time);
        } else if (videoRef.current.currentTime !== undefined) {
          // HTML5 video
          videoRef.current.currentTime = time;
        }
        
        dispatch({ type: 'SET_CURRENT_TIME', payload: time });
        
        trackInteraction({
          type: 'seek',
          timestamp: Date.now(),
          data: { from: state.currentTime, to: time },
        });
      }
    }, [state.currentTime, trackInteraction]),
    
    setVolume: useCallback((volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      
      if (videoRef.current) {
        if (videoRef.current.setVolume) {
          // YouTube player (0-100)
          videoRef.current.setVolume(clampedVolume * 100);
        } else if (videoRef.current.volume !== undefined) {
          // HTML5 video (0-1)
          videoRef.current.volume = clampedVolume;
        }
      }
      
      dispatch({ type: 'SET_VOLUME', payload: clampedVolume });
      dispatch({ type: 'SET_MUTED', payload: clampedVolume === 0 });
    }, []),
    
    toggleMute: useCallback(() => {
      if (state.isMuted) {
        actions.setVolume(state.volume || 0.5);
      } else {
        actions.setVolume(0);
      }
    }, [state.isMuted, state.volume]),
    
    setQuality: useCallback((quality: string) => {
      if (videoRef.current && videoRef.current.setPlaybackQuality) {
        // YouTube player
        videoRef.current.setPlaybackQuality(quality);
      }
      
      dispatch({ type: 'SET_QUALITY', payload: quality });
      
      trackInteraction({
        type: 'quality_change',
        timestamp: Date.now(),
        data: { from: state.quality, to: quality },
      });
    }, [state.quality, trackInteraction]),
    
    setSpeed: useCallback((speed: number) => {
      const clampedSpeed = Math.max(0.25, Math.min(2, speed));
      
      if (videoRef.current) {
        if (videoRef.current.setPlaybackRate) {
          // YouTube player
          videoRef.current.setPlaybackRate(clampedSpeed);
        } else if (videoRef.current.playbackRate !== undefined) {
          // HTML5 video
          videoRef.current.playbackRate = clampedSpeed;
        }
      }
      
      dispatch({ type: 'SET_SPEED', payload: clampedSpeed });
    }, []),
    
    setCurrentTime: useCallback((time: number) => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: time });
    }, []),
    
    setDuration: useCallback((duration: number) => {
      dispatch({ type: 'SET_DURATION', payload: duration });
    }, []),
    
    setPlaying: useCallback((playing: boolean) => {
      dispatch({ type: 'SET_PLAYING', payload: playing });
    }, []),
    
    setPaused: useCallback((paused: boolean) => {
      dispatch({ type: 'SET_PAUSED', payload: paused });
    }, []),
    
    setBuffering: useCallback((buffering: boolean) => {
      dispatch({ type: 'SET_BUFFERING', payload: buffering });
    }, []),
    
    toggleFullscreen: useCallback(() => {
      const element = playerRef.current || videoRef.current;
      if (!element) return;
      
      try {
        if (!state.isFullscreen) {
          // Enter fullscreen
          if (element.requestFullscreen) {
            element.requestFullscreen();
          } else if ((element as any).mozRequestFullScreen) {
            (element as any).mozRequestFullScreen();
          } else if ((element as any).webkitRequestFullscreen) {
            (element as any).webkitRequestFullscreen();
          } else if ((element as any).msRequestFullscreen) {
            (element as any).msRequestFullscreen();
          }
        } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }
        }
        
        trackInteraction({
          type: 'fullscreen',
          timestamp: Date.now(),
          data: { entering: !state.isFullscreen },
        });
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    }, [state.isFullscreen, trackInteraction]),
    
    togglePictureInPicture: useCallback(async () => {
      if (!videoRef.current || !('requestPictureInPicture' in document.createElement('video'))) {
        return;
      }
      
      try {
        if (!state.isPictureInPicture) {
          await videoRef.current.requestPictureInPicture();
        } else {
          await document.exitPictureInPicture();
        }
      } catch (error) {
        console.error('Picture-in-picture error:', error);
      }
    }, [state.isPictureInPicture]),
    
    skipBackward: useCallback((seconds: number = 10) => {
      const newTime = Math.max(0, state.currentTime - seconds);
      actions.seek(newTime);
    }, [state.currentTime]),
    
    skipForward: useCallback((seconds: number = 10) => {
      const newTime = Math.min(state.duration, state.currentTime + seconds);
      actions.seek(newTime);
    }, [state.currentTime, state.duration]),
    
    reset: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),
  };
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      dispatch({ type: 'SET_FULLSCREEN', payload: isCurrentlyFullscreen });
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
  
  // Handle picture-in-picture events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || videoElement.requestPictureInPicture === undefined) return;
    
    const handleEnterPip = () => dispatch({ type: 'SET_PICTURE_IN_PICTURE', payload: true });
    const handleLeavePip = () => dispatch({ type: 'SET_PICTURE_IN_PICTURE', payload: false });
    
    videoElement.addEventListener('enterpictureinpicture', handleEnterPip);
    videoElement.addEventListener('leavepictureinpicture', handleLeavePip);
    
    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handleEnterPip);
      videoElement.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, []);
  
  const contextValue: VideoPlayerContextType = {
    state,
    config,
    theme,
    actions,
    refs: {
      playerRef,
      videoRef,
      controlsRef,
    },
  };
  
  return (
    <VideoPlayerContext.Provider value={contextValue}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

// Hook to use the context
export const useVideoPlayer = (): VideoPlayerContextType => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within a VideoPlayerProvider');
  }
  return context;
};

// Hook for gesture handling
export const useVideoPlayerGestures = () => {
  const { actions, state, refs } = useVideoPlayer();
  
  const handleGesture = useCallback((gesture: GestureEvent) => {
    const { type, direction, velocity = 0, position } = gesture;
    
    switch (type) {
      case 'tap':
        // Show/hide controls
        break;
        
      case 'double_tap':
        // Play/pause
        if (state.isPlaying) {
          actions.pause();
        } else {
          actions.play();
        }
        break;
        
      case 'swipe':
        if (direction === 'left' || direction === 'right') {
          // Seek forward/backward
          const seekAmount = direction === 'right' ? 10 : -10;
          actions.seek(state.currentTime + seekAmount);
        } else if (direction === 'up' || direction === 'down') {
          // Volume control
          const volumeChange = direction === 'up' ? 0.1 : -0.1;
          actions.setVolume(state.volume + volumeChange);
        }
        break;
        
      case 'pinch':
        // Could be used for zoom in future
        break;
        
      case 'long_press':
        // Speed control or context menu
        break;
    }
  }, [actions, state]);
  
  return { handleGesture };
};