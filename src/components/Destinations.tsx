import React, { useState, useEffect } from 'react';
import { MapPin, Star, Play, Eye, Clock, Users, Loader2 } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { subscribeToDestinations, Destination } from '../api/destinations';

interface DestinationsProps {
  onVRExperience?: (destination: Destination) => void;
}

const Destinations: React.FC<DestinationsProps> = ({ onVRExperience }) => {
  const { t } = useTranslation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Array of destination hero videos
  const videos = [
    {
      id: 'destinations-india-gate',
      title: 'India Gate Monument Experience',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'destinations-goa-beaches',
      title: 'Goa Beach Paradise',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/2531709/pexels-photo-2531709.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'destinations-rajasthan-palaces',
      title: 'Rajasthan Royal Palaces',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/4429277/pexels-photo-4429277.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'destinations-pink-city',
      title: 'Jaipur Pink City Heritage',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/3581368/pexels-photo-3581368.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    }
  ];

  // Firebase subscription for destinations
  useEffect(() => {
    console.log('🔥 Destinations: Setting up Firebase subscription');
    
    const unsubscribe = subscribeToDestinations(
      (fetchedDestinations) => {
        console.log('✅ Destinations: Received destinations from Firebase:', fetchedDestinations.length);
        setDestinations(fetchedDestinations);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ Destinations: Firebase error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Destinations: Cleaning up Firebase subscription');
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Auto-rotate videos every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
      setIsVideoLoaded(false);
      setVideoError(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [videos.length]);

  const currentVideo = videos[currentVideoIndex];

  const handleVRExperience = (destination: Destination) => {
    if (onVRExperience) {
      onVRExperience(destination);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Animated Background */}
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
              <span className="text-sm font-medium text-white">Explore Destinations</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-responsive-xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
              Discover
              <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Incredible India
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-responsive-sm text-gray-200 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              Explore handpicked destinations showcasing India's diverse landscapes, rich heritage, and cultural treasures
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2">
                <Eye className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-pulse" />
                <span>View All Destinations</span>
              </button>
              
              <button className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <span>Popular Tours</span>
                <Play className="w-4 sm:w-5 h-4 sm:h-5 group-hover:scale-110 transition-transform" />
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

      {/* Destinations Grid Section */}
      <section className="py-20 bg-white relative">
        {/* Vintage India Map Background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none"><path d="M150 50c20-10 40-5 60 5s35 25 45 45c10 20 5 40-5 60s-25 35-45 45c-20 10-40 5-60-5s-35-25-45-45c-10-20-5-40 5-60s25-35 45-45z" stroke="%23f97316" stroke-width="1" fill="none" opacity="0.3"/><circle cx="200" cy="150" r="3" fill="%23f97316" opacity="0.5"/><circle cx="160" cy="100" r="2" fill="%23f97316" opacity="0.3"/><circle cx="240" cy="120" r="2" fill="%23f97316" opacity="0.3"/><path d="M100 200c30-20 60-10 80 10s20 50 0 70s-50 20-70 0s-20-50-10-80z" stroke="%23f97316" stroke-width="1" fill="none" opacity="0.2"/></svg>')`,
            backgroundRepeat: 'repeat',
            backgroundSize: '400px 300px'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              <span>Popular Destinations</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
              Explore India's Wonders
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From ancient monuments to pristine landscapes, discover the most captivating destinations that showcase India's incredible diversity and rich cultural heritage.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center space-x-3 text-orange-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-lg font-medium">Loading destinations...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                <p className="text-red-600 font-medium mb-2">Unable to load destinations</p>
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Destinations Grid */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {destinations.map((destination) => (
                  <div
                    key={destination.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden">
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between text-white">
                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                              Featured
                            </span>
                            {destination.vrAvailable && (
                              <button
                                onClick={() => handleVRExperience(destination)}
                                className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors"
                                title="Experience in VR"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                            {destination.name}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{destination.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-semibold">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          <span>{destination.rating}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {destination.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{destination.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{destination.visitors}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleVRExperience(destination)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Experience in VR</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              <div className="text-center mt-12">
                <button className="bg-transparent border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                  Load More Destinations
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Destinations;