import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  PictureInPicture,
  Download,
  Share2,
} from 'lucide-react';
import { useVideoPlayer } from '../../context/VideoPlayerContext';
import { videoPlayerAnimations, videoPlayerClasses } from '../../utils/videoPlayerTheme';

interface EnhancedVideoControlsProps {
  showControls: boolean;
  onShowControlsChange: (show: boolean) => void;
  className?: string;
}

const EnhancedVideoControls: React.FC<EnhancedVideoControlsProps> = ({
  showControls,
  onShowControlsChange,
  className = '',
}) => {
  const { state, actions, theme, config } = useVideoPlayer();
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Auto-hide controls
  useEffect(() => {
    if (showControls && state.isPlaying && !isDragging) {
      controlsTimeoutRef.current = setTimeout(() => {
        onShowControlsChange(false);
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, state.isPlaying, isDragging, onShowControlsChange]);
  
  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Progress bar handlers
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    
    actions.seek(newTime);
  }, [state.duration, actions]);
  
  const handleProgressDrag = useCallback((e: MouseEvent) => {
    if (!progressRef.current || !isDragging) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, dragX / rect.width));
    const newTime = percentage * state.duration;
    
    actions.seek(newTime);
  }, [isDragging, state.duration, actions]);
  
  const handleProgressMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      const handleMouseUp = () => setIsDragging(false);
      const handleMouseMove = handleProgressDrag;
      
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, handleProgressDrag]);
  
  // Volume control handlers
  const handleVolumeChange = useCallback((e: React.MouseEvent) => {
    if (!volumeRef.current) return;
    
    const rect = volumeRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = 1 - (clickY / rect.height);
    const newVolume = Math.max(0, Math.min(1, percentage));
    
    actions.setVolume(newVolume);
  }, [actions]);
  
  // Quality levels
  const qualityLevels = ['auto', '480p', '720p', '1080p'];
  
  // Speed levels
  const speedLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          className={`absolute inset-x-0 bottom-0 ${className}`}
          variants={videoPlayerAnimations.slideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          onMouseEnter={() => onShowControlsChange(true)}
          onMouseLeave={() => !isDragging && onShowControlsChange(false)}
        >
          {/* Progress Bar */}
          <div className="px-4 pb-2">
            <div
              ref={progressRef}
              className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              {/* Buffer indicator */}
              {state.bufferedRanges && (
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {Array.from({ length: state.bufferedRanges.length }, (_, i) => (
                    <div
                      key={i}
                      className="absolute h-full bg-white/30 rounded-full"
                      style={{
                        left: `${(state.bufferedRanges!.start(i) / state.duration) * 100}%`,
                        width: `${((state.bufferedRanges!.end(i) - state.bufferedRanges!.start(i)) / state.duration) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Progress */}
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                style={{
                  width: `${(state.currentTime / state.duration) * 100}%`,
                }}
                variants={videoPlayerAnimations.progressBar}
              />
              
              {/* Thumb */}
              <motion.div
                className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  left: `${(state.currentTime / state.duration) * 100}%`,
                  marginLeft: '-8px',
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            </div>
          </div>
          
          {/* Control Bar */}
          <motion.div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm"
            variants={videoPlayerAnimations.fadeIn}
          >
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <motion.button
                className={videoPlayerClasses.controlButton}
                onClick={state.isPlaying ? actions.pause : actions.play}
                variants={videoPlayerAnimations.button}
                whileHover="whileHover"
                whileTap="whileTap"
                onMouseEnter={() => setHoveredButton('play')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {state.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </motion.button>
              
              {/* Skip Back */}
              <motion.button
                className={videoPlayerClasses.controlButton}
                onClick={() => actions.skipBackward?.(10)}
                variants={videoPlayerAnimations.button}
                whileHover="whileHover"
                whileTap="whileTap"
                onMouseEnter={() => setHoveredButton('skipBack')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <SkipBack className="w-4 h-4" />
              </motion.button>
              
              {/* Skip Forward */}
              <motion.button
                className={videoPlayerClasses.controlButton}
                onClick={() => actions.skipForward?.(10)}
                variants={videoPlayerAnimations.button}
                whileHover="whileHover"
                whileTap="whileTap"
                onMouseEnter={() => setHoveredButton('skipForward')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <SkipForward className="w-4 h-4" />
              </motion.button>
              
              {/* Volume Control */}
              <div 
                className="relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <motion.button
                  className={videoPlayerClasses.controlButton}
                  onClick={actions.toggleMute}
                  variants={videoPlayerAnimations.button}
                  whileHover="whileHover"
                  whileTap="whileTap"
                >
                  {state.isMuted || state.volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </motion.button>
                
                {/* Volume Slider */}
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-black/80 backdrop-blur-sm rounded-lg"
                      variants={videoPlayerAnimations.slideUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div
                        ref={volumeRef}
                        className="w-2 h-20 bg-white/20 rounded-full cursor-pointer relative"
                        onClick={handleVolumeChange}
                      >
                        <div
                          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"
                          style={{ height: `${state.volume * 100}%` }}
                        />
                        <div
                          className="absolute w-3 h-3 bg-white rounded-full transform -translate-x-0.5"
                          style={{ bottom: `${state.volume * 100}%`, marginBottom: '-6px' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </div>
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              {/* Settings */}
              <div className="relative">
                <motion.button
                  className={videoPlayerClasses.controlButton}
                  onClick={() => setShowSettings(!showSettings)}
                  variants={videoPlayerAnimations.button}
                  whileHover="whileHover"
                  whileTap="whileTap"
                >
                  <Settings className="w-4 h-4" />
                </motion.button>
                
                {/* Settings Menu */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      className="absolute bottom-full right-0 mb-2 p-4 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 min-w-48"
                      variants={videoPlayerAnimations.slideUp}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {/* Quality Settings */}
                      <div className="mb-4">
                        <h4 className="text-white text-sm font-medium mb-2">Quality</h4>
                        <div className="space-y-1">
                          {qualityLevels.map((quality) => (
                            <button
                              key={quality}
                              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                state.quality === quality
                                  ? 'bg-orange-500 text-white'
                                  : 'text-gray-300 hover:bg-white/10'
                              }`}
                              onClick={() => {
                                actions.setQuality(quality);
                                setShowSettings(false);
                              }}
                            >
                              {quality}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Speed Settings */}
                      <div>
                        <h4 className="text-white text-sm font-medium mb-2">Speed</h4>
                        <div className="space-y-1">
                          {speedLevels.map((speed) => (
                            <button
                              key={speed}
                              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                state.speed === speed
                                  ? 'bg-orange-500 text-white'
                                  : 'text-gray-300 hover:bg-white/10'
                              }`}
                              onClick={() => {
                                actions.setSpeed(speed);
                                setShowSettings(false);
                              }}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Picture in Picture */}
              {config.pip && (
                <motion.button
                  className={videoPlayerClasses.controlButton}
                  onClick={actions.togglePictureInPicture}
                  variants={videoPlayerAnimations.button}
                  whileHover="whileHover"
                  whileTap="whileTap"
                >
                  <PictureInPicture className="w-4 h-4" />
                </motion.button>
              )}
              
              {/* Fullscreen */}
              <motion.button
                className={videoPlayerClasses.controlButton}
                onClick={actions.toggleFullscreen}
                variants={videoPlayerAnimations.button}
                whileHover="whileHover"
                whileTap="whileTap"
              >
                {state.isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </motion.div>
          
          {/* Tooltip */}
          <AnimatePresence>
            {hoveredButton && (
              <motion.div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs rounded"
                variants={videoPlayerAnimations.fadeIn}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {hoveredButton === 'play' && (state.isPlaying ? 'Pause' : 'Play')}
                {hoveredButton === 'skipBack' && 'Skip Back 10s'}
                {hoveredButton === 'skipForward' && 'Skip Forward 10s'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedVideoControls;