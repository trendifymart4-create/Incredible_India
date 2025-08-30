// Enhanced Video Player Types and Interfaces

export interface VideoPlayerTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    overlay: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    controls: string;
    margins: string;
    padding: string;
    controlHeight: string;
  };
  animations: {
    duration: string;
    easing: string;
    fadeIn: string;
    slideUp: string;
  };
  glassMorphism: {
    backdropFilter: string;
    backgroundColor: string;
    border: string;
    borderRadius: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface VideoSource {
  quality: string;
  url: string;
  type: 'youtube' | 'mp4' | 'webm' | 'hls';
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
}

export interface VideoOverlay {
  id: string;
  type: 'hotspot' | 'text' | 'cta' | 'annotation';
  content: string;
  position: {
    x: number;
    y: number;
  };
  showTime: number;
  hideTime: number;
  interactive?: boolean;
  onClick?: () => void;
}

export interface InteractionEvent {
  type: 'play' | 'pause' | 'seek' | 'quality_change' | 'fullscreen' | 'gesture';
  timestamp: number;
  data?: any;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  quality: string;
  speed: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  hasError: boolean;
  errorMessage?: string;
  bufferedRanges: TimeRanges | null;
}

export interface VideoPlayerConfig {
  autoplay?: boolean;
  controls?: boolean;
  quality?: 'auto' | '480p' | '720p' | '1080p' | '4K';
  speed?: number;
  chapters?: VideoChapter[];
  overlays?: VideoOverlay[];
  gestures?: boolean;
  pip?: boolean;
  analytics?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
  playsInline?: boolean;
  loop?: boolean;
  theme?: Partial<VideoPlayerTheme>;
}

export interface EnhancedVideoPlayerProps {
  src: string | VideoSource[];
  poster?: string;
  title?: string;
  description?: string;
  duration?: string;
  youtubeId?: string;
  config?: VideoPlayerConfig;
  onProgress?: (progress: number) => void;
  onQualityChange?: (quality: string) => void;
  onInteraction?: (event: InteractionEvent) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface VideoPlayerContextType {
  state: VideoPlayerState;
  config: VideoPlayerConfig;
  theme: VideoPlayerTheme;
  actions: {
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    skipForward?: (seconds?: number) => void;
    skipBackward?: (seconds?: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    setQuality: (quality: string) => void;
    setSpeed: (speed: number) => void;
    toggleFullscreen: () => void;
    togglePictureInPicture: () => void;
    setCurrentTime?: (time: number) => void;
    setDuration?: (duration: number) => void;
    setPlaying?: (playing: boolean) => void;
    setPaused?: (paused: boolean) => void;
    setBuffering?: (buffering: boolean) => void;
    reset: () => void;
  };
  refs: {
    playerRef: React.RefObject<HTMLDivElement>;
    videoRef: React.RefObject<HTMLVideoElement | any>;
    controlsRef: React.RefObject<HTMLDivElement>;
  };
}

export interface GestureEvent {
  type: 'tap' | 'double_tap' | 'swipe' | 'pinch' | 'long_press';
  direction?: 'left' | 'right' | 'up' | 'down';
  velocity?: number;
  scale?: number;
  position: { x: number; y: number };
}

export interface BufferStrategy {
  minBuffer: number;
  maxBuffer: number;
  targetBuffer: number;
  rebufferThreshold: number;
}

export interface QualityLevel {
  level: string;
  width: number;
  height: number;
  bitrate: number;
  url?: string;
}