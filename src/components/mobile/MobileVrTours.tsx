import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Play, Star, Clock, Users } from 'lucide-react';

const MobileVrTours: React.FC = () => {
  const vrTours = [
    {
      id: 1,
      title: "Taj Mahal 360°",
      location: "Agra, Uttar Pradesh",
      duration: "15 min",
      rating: 4.9,
      views: "2.1K",
      thumbnail: "https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      featured: true
    },
    {
      id: 2,
      title: "Kerala Backwaters",
      location: "Alleppey, Kerala",
      duration: "12 min",
      rating: 4.8,
      views: "1.8K",
      thumbnail: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Rajasthan Desert",
      location: "Jaisalmer, Rajasthan",
      duration: "18 min",
      rating: 4.7,
      views: "1.5K",
      thumbnail: "https://images.unsplash.com/photo-1477587458883-47145ed94245?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="pt-16 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">VR Tours</h1>
          <p className="text-gray-600">Immersive virtual reality experiences</p>
        </div>
      </div>

      {/* Featured Tour */}
      {vrTours.filter(tour => tour.featured).map((tour) => (
        <div key={tour.id} className="px-4 py-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Featured Experience</h2>
          <motion.div
            className="bg-white rounded-xl overflow-hidden shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative h-48">
              <img
                src={tour.thumbnail}
                alt={tour.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <motion.button
                  className="bg-white/20 backdrop-blur-md rounded-full p-4"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play className="text-white ml-1" size={32} />
                </motion.button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  360° VR
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">{tour.title}</h3>
              <p className="text-gray-600 mb-3">{tour.location}</p>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    {tour.duration}
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="mr-1" />
                    {tour.views}
                  </div>
                </div>
                <div className="flex items-center">
                  <Star size={16} className="mr-1 text-yellow-400" />
                  {tour.rating}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ))}

      {/* All Tours */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">All VR Tours</h2>
        <div className="space-y-4">
          {vrTours.map((tour, index) => (
            <motion.div
              key={tour.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex">
                <div className="relative w-24 h-24">
                  <img
                    src={tour.thumbnail}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Camera className="text-white" size={20} />
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <h3 className="font-semibold text-gray-800 mb-1">{tour.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{tour.location}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span>{tour.duration}</span>
                      <span>{tour.views} views</span>
                    </div>
                    <div className="flex items-center">
                      <Star size={14} className="mr-1 text-yellow-400" />
                      {tour.rating}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileVrTours;