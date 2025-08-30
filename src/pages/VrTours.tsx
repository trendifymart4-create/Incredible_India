import React, { useState, useEffect } from 'react';
import { MapPin, Play } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

const VrTours: React.FC = () => {
  const { t } = useTranslation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Array of VR tour videos
  const videos = [
    {
      id: 'vr-red-fort',
      title: 'VR Red Fort Delhi Experience',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
    },
    {
      id: 'vr-mysore-palace',
      title: 'VR Mysore Palace Experience',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
    },
    {
      id: 'vr-golden-temple',
      title: 'VR Golden Temple Amritsar',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1588584435653-3f36d5f9a8d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
    },
    {
      id: 'vr-charminar',
      title: 'VR Charminar Hyderabad',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1650374772013-7f1da10b4d6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
    }
  ];

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
              <Play className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">Immersive VR Technology</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-responsive-xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
              Immersive
              <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Virtual Reality Tours
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-responsive-sm text-gray-200 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience India's most iconic destinations in stunning 360° virtual reality from the comfort of your home
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2">
                <Play className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-pulse" />
                <span>Start VR Experience</span>
              </button>
              
              <button className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <span>Learn More</span>
                <MapPin className="w-4 sm:w-5 h-4 sm:h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { number: '25+', label: 'VR Experiences' },
                { number: '360°', label: 'Full Immersion' },
                { number: '4K', label: 'Ultra HD Quality' },
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

      {/* VR Experience Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Explore India in Virtual Reality
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Step into our immersive VR experiences and discover the beauty of India from the comfort of your home
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Taj Mahal Experience",
                description: "Walk through the iconic monument and learn about its history",
                image: "https://images.pexels.com/photos/16783937/pexels-photo-16783937/free-photo-of-taj-mahal-in-agra-india.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                title: "Kerala Backwaters",
                description: "Cruise through the serene backwaters of Kerala",
                image: "https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                title: "Jaipur Palaces",
                description: "Explore the magnificent palaces of the Pink City",
                image: "https://images.pexels.com/photos/3581369/pexels-photo-3581369.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                title: "Goa Beaches",
                description: "Relax on the pristine beaches of Goa",
                image: "https://images.pexels.com/photos/1450354/pexels-photo-1450354.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                title: "Himalayan Trek",
                description: "Hike through the majestic Himalayan ranges",
                image: "https://images.pexels.com/photos/1365426/pexels-photo-1365426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                title: "Delhi Monuments",
                description: "Visit the historical monuments of India's capital",
                image: "https://images.pexels.com/photos/1534412/pexels-photo-153412.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              }
            ].map((tour, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={tour.image} 
                    alt={tour.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.title}</h3>
                  <p className="text-gray-600 mb-4">{tour.description}</p>
                  <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300">
                    Explore Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Getting started with our VR tours is simple and straightforward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Destination",
                description: "Browse our collection of VR experiences and select your preferred destination"
              },
              {
                step: "02",
                title: "Connect Your Device",
                description: "Use any VR headset or simply view on your computer or mobile device"
              },
              {
                step: "03",
                title: "Start Exploring",
                description: "Immerse yourself in the experience and discover India like never before"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-orange-600">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VrTours;