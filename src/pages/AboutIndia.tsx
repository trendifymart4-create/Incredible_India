import React, { useState, useEffect } from 'react';
import { MapPin, Globe } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';

const AboutIndia: React.FC = () => {
  const { t } = useTranslation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Array of India heritage videos
  const videos = [
    {
      id: 'india-rajasthan-desert',
      title: 'Rajasthan Desert Heritage',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
    },
    {
      id: 'india-hampi-ruins',
      title: 'Hampi Ancient Ruins',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
    },
    {
      id: 'india-varanasi-ghats',
      title: 'Varanasi Sacred Ghats',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
    },
    {
      id: 'india-khajuraho-temples',
      title: 'Khajuraho Temple Architecture',
      url: '/assets/fallback-video.mp4',
      fallbackImage: 'https://images.unsplash.com/photo-1582652516232-60ac2b6be895?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&h=1080&q=80'
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
              <Globe className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">Discover the Heritage</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-responsive-xl font-serif font-bold text-white mb-4 sm:mb-6 leading-tight">
              Discover the
              <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Incredible India
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-responsive-sm text-gray-200 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              A land of diversity, culture, and endless wonders spanning thousands of years of rich heritage
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center space-x-2">
                <Globe className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-pulse" />
                <span>Explore Heritage</span>
              </button>
              
              <button className="group bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <span>Cultural Journey</span>
                <MapPin className="w-4 sm:w-5 h-4 sm:h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { number: '5000+', label: 'Years of History' },
                { number: '1600+', label: 'Languages' },
                { number: '28', label: 'States & UTs' },
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

      {/* Introduction Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
                A Tapestry of Cultures
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                India is a vibrant tapestry of cultures, languages, religions, and traditions. From the snow-capped peaks of the Himalayas to the sun-kissed beaches of the south, India offers a diverse range of experiences that captivate travelers from around the world.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                With over 2,000 years of history, India is home to magnificent monuments, ancient temples, bustling markets, and serene landscapes. Each region has its own unique identity, cuisine, and customs, making every visit a new adventure.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're seeking spiritual enlightenment, culinary delights, architectural marvels, or wildlife encounters, India promises an unforgettable journey.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-xl">
              <img 
                src="https://images.pexels.com/photos/1534411/pexels-photo-1534411.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="India Landscape" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cultural Highlights Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Cultural Highlights
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore the rich cultural heritage of India through its festivals, traditions, and art forms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Festivals",
                description: "Experience vibrant celebrations like Diwali, Holi, and Eid that showcase India's cultural diversity",
                icon: "🎉"
              },
              {
                title: "Cuisine",
                description: "Savor the flavors of regional delicacies, from spicy curries to sweet desserts",
                icon: "🍛"
              },
              {
                title: "Art & Craft",
                description: "Discover traditional arts like Madhubani painting, Warli art, and intricate handicrafts",
                icon: "🎨"
              },
              {
                title: "Music & Dance",
                description: "Witness classical dance forms like Bharatanatyam, Kathak, and soulful music traditions",
                icon: "🎭"
              }
            ].map((highlight, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">{highlight.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{highlight.title}</h3>
                <p className="text-gray-600">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Diversity Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              Regional Diversity
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each region of India offers a unique experience with its own distinct culture and traditions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                region: "North India",
                description: "Home to the majestic Himalayas, historical monuments like the Taj Mahal, and vibrant cities like Delhi and Jaipur",
                image: "https://images.pexels.com/photos/1534412/pexels-photo-153412.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                region: "South India",
                description: "Known for its classical temples, backwaters of Kerala, and rich traditions of dance and music",
                image: "https://images.pexels.com/photos/962465/pexels-photo-962465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                region: "East India",
                description: "Famous for its ancient temples, tea gardens of Assam, and the cultural capital of Kolkata",
                image: "https://images.pexels.com/photos/16783938/pexels-photo-16783938/free-photo-of-victoria-memorial-in-kolkata-india.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                region: "West India",
                description: "Boasts the bustling city of Mumbai, historic forts of Rajasthan, and pristine beaches of Goa",
                image: "https://images.pexels.com/photos/1450355/pexels-photo-1450355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                region: "Northeast India",
                description: "A paradise of biodiversity with lush green valleys, vibrant tribes, and unique cultures",
                image: "https://images.pexels.com/photos/1365427/pexels-photo-1365427.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              },
              {
                region: "Central India",
                description: "Rich in wildlife with famous national parks and the ancient temples of Khajuraho",
                image: "https://images.pexels.com/photos/16783939/pexels-photo-16783939/free-photo-of-tiger-statue-in-khajuraho-india.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              }
            ].map((region, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105">
                <div className="h-40 overflow-hidden">
                  <img 
                    src={region.image} 
                    alt={region.region} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{region.region}</h3>
                  <p className="text-gray-600">{region.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutIndia;