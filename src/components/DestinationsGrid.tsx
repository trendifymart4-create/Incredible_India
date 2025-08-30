import React, { useState, useEffect } from 'react';
import { MapPin, Star, Play, Clock, Users, Loader2 } from 'lucide-react';
import { subscribeToDestinations, Destination } from '../api/destinations';

interface DestinationsGridProps {
  onVRExperience?: (destination: Destination) => void;
}

const DestinationsGrid: React.FC<DestinationsGridProps> = ({ onVRExperience }) => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 DestinationsGrid: Setting up Firebase subscription');
    
    const unsubscribe = subscribeToDestinations(
      (fetchedDestinations) => {
        console.log('✅ DestinationsGrid: Received destinations from Firebase:', fetchedDestinations.length);
        // Limit to 6 destinations for the grid
        setDestinations(fetchedDestinations.slice(0, 6));
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('❌ DestinationsGrid: Firebase error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 DestinationsGrid: Cleaning up Firebase subscription');
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleVRExperience = (destination: Destination) => {
    if (onVRExperience) {
      onVRExperience(destination);
    }
  };

  return (
    <section className="py-20 bg-gray-50 relative">
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
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <a
            href="/destinations"
            className="inline-block bg-transparent border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105"
          >
            View All Destinations
          </a>
        </div>
      </div>
    </section>
  );
};

export default DestinationsGrid;