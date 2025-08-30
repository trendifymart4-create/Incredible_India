import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Calendar, Globe } from 'lucide-react';

const MobileAboutIndia: React.FC = () => {
  const stats = [
    { label: "States & UTs", value: "28 + 8", icon: MapPin },
    { label: "Population", value: "1.4B+", icon: Users },
    { label: "Heritage Sites", value: "40+", icon: Globe },
    { label: "Languages", value: "700+", icon: Calendar },
  ];

  const highlights = [
    {
      title: "Rich Cultural Heritage",
      description: "India is home to one of the world's oldest civilizations with a rich cultural heritage spanning over 5,000 years.",
      image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Diverse Landscapes",
      description: "From the Himalayas to the coastlines, India offers incredibly diverse geographical landscapes.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Spiritual Journey",
      description: "The birthplace of four major religions and numerous spiritual practices that have influenced the world.",
      image: "https://images.unsplash.com/photo-1582632431614-4ad2e4d46201?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <div className="pt-16 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
        <div className="px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Incredible India</h1>
            <p className="text-orange-100 mb-4">
              Discover the land of diversity, culture, and endless wonders
            </p>
            <div className="w-16 h-1 bg-white/30 rounded-full"></div>
          </motion.div>
        </div>
      </div>

      {/* Statistics */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-white rounded-xl p-4 shadow-sm text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <stat.icon className="mx-auto mb-2 text-orange-500" size={24} />
              <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">What Makes India Incredible</h2>
        <div className="space-y-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.title}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <img
                src={highlight.image}
                alt={highlight.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {highlight.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="px-4 py-8">
        <motion.div
          className="bg-white rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">About Our Platform</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Our platform is designed to showcase the incredible diversity and beauty of India 
            through immersive virtual reality experiences and comprehensive destination guides.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Whether you're planning your next adventure or exploring from the comfort of your home, 
            we bring the wonders of India directly to you through cutting-edge technology and 
            expert curation.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileAboutIndia;