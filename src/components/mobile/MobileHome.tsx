import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, Star, Clock, Users } from 'lucide-react';
import { Destination } from '../../api/destinations';
import { useHaptics } from '../../hooks/useHaptics';

interface MobileHomeProps {
  destinations: Destination[];
  loading: boolean;
  onDestinationSelect: (destination: Destination) => void;
  onVRExperience: (destination: Destination) => void;
}

const MobileHome: React.FC<MobileHomeProps> = ({
  destinations,
  loading,
  onDestinationSelect,
  onVRExperience,
}) => {
  const { triggerHaptic } = useHaptics();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const featuredDestinations = destinations.slice(0, 3);
  const recentlyViewed = destinations.slice(3, 6);

  const handleDestinationTap = (destination: Destination) => {
    triggerHaptic('medium');
    onDestinationSelect(destination);
  };

  const handleVRTap = (destination: Destination, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    onVRExperience(destination);
  };

  if (loading) {
    return (
      <div className="pt-16 pb-20 px-4 bg-gradient-to-br from-orange-50 to-blue-50 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="grid grid-cols-1 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 bg-gradient-to-br from-orange-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {getGreeting()}! 👋
          </h1>
          <p className="text-gray-600">
            Discover the incredible beauty of India
          </p>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            className="bg-white rounded-xl p-4 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="text-orange-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">{destinations.length}</p>
            <p className="text-xs text-gray-600">Destinations</p>
          </motion.div>
          
          <motion.div
            className="bg-white rounded-xl p-4 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Camera className="text-blue-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">150+</p>
            <p className="text-xs text-gray-600">VR Tours</p>
          </motion.div>
          
          <motion.div
            className="bg-white rounded-xl p-4 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users className="text-green-500 mb-2" size={24} />
            <p className="text-2xl font-bold text-gray-800">10K+</p>
            <p className="text-xs text-gray-600">Travelers</p>
          </motion.div>
        </div>
      </div>

      {/* Featured Destinations */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Featured</h2>
          <button className="text-orange-500 font-medium">See All</button>
        </div>
        
        <div className="space-y-4">
          {featuredDestinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDestinationTap(destination)}
            >
              <div className="relative h-48">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <button
                  onClick={(e) => handleVRTap(destination, e)}
                  className="absolute top-3 right-3 bg-white/20 backdrop-blur-md rounded-full p-2"
                >
                  <Camera className="text-white" size={20} />
                </button>
                
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-bold mb-1">{destination.name}</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {destination.state}
                    </div>
                    <div className="flex items-center">
                      <Star size={16} className="mr-1 text-yellow-400" />
                      {destination.rating}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="px-4 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recently Viewed</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {recentlyViewed.map((destination, index) => (
              <motion.div
                key={destination.id}
                className="flex-shrink-0 w-32 bg-white rounded-lg overflow-hidden shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDestinationTap(destination)}
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-20 object-cover"
                />
                <div className="p-2">
                  <h4 className="font-medium text-xs text-gray-800 truncate">
                    {destination.name}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {destination.state}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHome;