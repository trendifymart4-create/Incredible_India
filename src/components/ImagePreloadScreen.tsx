// Loading screen component for image preloading - Simple spinner version
import React from 'react';
import { Image, CheckCircle } from 'lucide-react';
import { PreloadStatus } from '../utils/imagePreloader';

interface ImagePreloadScreenProps {
  status: PreloadStatus | null;
  isComplete: boolean;
  onSkip?: () => void;
  onComplete?: () => void;
}

const ImagePreloadScreen: React.FC<ImagePreloadScreenProps> = ({
  status,
  isComplete,
  onSkip,
  onComplete
}) => {
  // Auto-hide after completion
  React.useEffect(() => {
    if (isComplete && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800); // Show success for 0.8 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  const progress = status?.progress || 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 z-50 flex items-center justify-center">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: '60px 60px, 40px 40px',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 text-center text-white">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="relative mx-auto w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
            {isComplete ? (
              <CheckCircle className="w-12 h-12 text-green-400 animate-pulse" />
            ) : (
              <Image className="w-12 h-12" />
            )}
            
            {/* Large Spinner ring for loading */}
            {!isComplete && (
              <div className="absolute inset-0 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-serif font-bold mb-2">
          {isComplete ? 'Ready to Explore!' : 'Loading Amazing India'}
        </h1>
        
        {/* Subtitle */}
        <p className="text-white/90 mb-8 text-sm md:text-base">
          {isComplete 
            ? 'Experience incredible destinations!' 
            : 'Preparing your virtual journey...'
          }
        </p>

        {/* Simple Progress Indicator */}
        {!isComplete && (
          <>
            {/* Minimal Progress Bar - No Numbers */}
            <div className="mb-6">
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-white to-yellow-200 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Loading Message */}
            <div className="flex items-center justify-center space-x-3 text-sm text-white/80 mb-6">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="ml-3">Loading content...</span>
            </div>
          </>
        )}

        {/* Success message */}
        {isComplete && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-center space-x-2 text-green-100 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span>Ready for an incredible journey!</span>
            </div>
          </div>
        )}

        {/* Skip button (only show during loading) */}
        {!isComplete && onSkip && (
          <button
            onClick={onSkip}
            className="text-white/70 hover:text-white text-sm underline transition-colors mt-4 font-medium"
          >
            Skip and continue
          </button>
        )}
      </div>

      {/* CSS for animations - using regular style tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ImagePreloadScreen;