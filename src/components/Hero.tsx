import React from 'react';
import { useState, useEffect } from 'react';
import { Play, ArrowRight, MapPin } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

const Hero: React.FC = () => {
  console.log('Hero: component rendered');
  const { t } = useTranslation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Array of Indian destination videos
  const videos = [
    {
      id: 'taj-mahal',
      title: 'Taj Mahal, Agra',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'hawa-mahal',
      title: 'Hawa Mahal, Jaipur',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'kerala',
      title: 'Kerala Backwaters',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'goa',
      title: 'Goa Beaches',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'ladakh',
      title: 'Ladakh Mountains',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    }
  ];

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    console.log('Hero: video rotation useEffect triggered');
    const interval = setInterval(() => {
      console.log('Hero: video rotation interval triggered');
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
      setIsVideoLoaded(false);
      setVideoError(false);
    }, 6000);

    return () => {
      console.log('Hero: cleaning up video rotation interval');
      clearInterval(interval);
    };
  }, [videos.length]);

  const currentVideo = videos[currentVideoIndex];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        {/* Video Element */}
        {!videoError && (
          <video
            key={currentVideo.id}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              isVideoLoaded && !videoError ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => {
              setIsVideoLoaded(true);
              setVideoError(false);
            }}
            onError={() => {
              setVideoError(true);
              setIsVideoLoaded(false);
            }}
          >
            <source src={currentVideo.url} type="video/mp4" />
          </video>
        )}

        {/* Fallback Background Image */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            isVideoLoaded && !videoError ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            backgroundImage: `url('${currentVideo.fallbackImage}')`,
          }}
          onError={(e) => {
            // If image also fails, use a solid gradient background
            (e.target as HTMLElement).style.backgroundImage = 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)';
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>

        {/* Video Title Overlay */}
        <div className="absolute bottom-8 left-8 z-10">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">{currentVideo.title}</p>
          </div>
        </div>

        {/* Video Navigation Dots */}
        <div className="absolute bottom-8 right-8 z-10 flex space-x-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentVideoIndex(index);
                setIsVideoLoaded(false);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentVideoIndex
                  ? 'bg-orange-500 scale-125'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`View ${videos[index].title}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-white">Discover the Incredible</span>
          </div>
{/* Main Heading */}
          <h1 className="text-responsive-xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
            Experience India
            <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Like Never Before
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-responsive-sm text-gray-200 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
            Immerse yourself in the rich tapestry of India's culture, heritage, and breathtaking landscapes through cutting-edge VR experiences
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2">
              <Play className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-pulse" />
              <span>Explore in 360°</span>
            </button>
            
            <button className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
              <span>{t('destinations.title')}</span>
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { number: '50+', label: 'VR Destinations' },
              { number: '360°', label: 'Immersive Views' },
              { number: '1M+', label: 'Virtual Visitors' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;