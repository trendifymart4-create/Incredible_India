import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Camera, 
  Heart, 
  Share2, 
  Clock,
  Users,
  Thermometer,
  Calendar
} from 'lucide-react';
import { Destination } from '../../api/destinations';
import { subscribeToDestinations } from '../../api/destinations';
import { useHaptics } from '../../hooks/useHaptics';

const MobileDestinationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptics();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToDestinations(
      (destinations) => {
        const found = destinations.find(dest => dest.id === id);
        setDestination(found || null);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching destination:', error);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [id]);

  const handleBack = () => {
    triggerHaptic('light');
    navigate(-1);
  };

  const handleFavorite = () => {
    triggerHaptic('medium');
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    triggerHaptic('light');
    if (navigator.share) {
      navigator.share({
        title: destination?.name,
        text: `Check out ${destination?.name} in ${destination?.state}`,
        url: window.location.href,
      });
    }
  };

  const handleVRTour = () => {
    triggerHaptic('heavy');
    // VR tour implementation would go here
  };

  if (loading) {
    return (
      <div className="pt-16 pb-20 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-300"></div>
          <div className="p-4 space-y-4">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="pt-16 pb-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Destination not found</p>
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 bg-gray-50 min-h-screen">
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Navigation Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <motion.button
            onClick={handleBack}
            className="bg-white/20 backdrop-blur-md rounded-full p-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="text-white" size={20} />
          </motion.button>
          
          <div className="flex space-x-2">
            <motion.button
              onClick={handleShare}
              className="bg-white/20 backdrop-blur-md rounded-full p-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share2 className="text-white" size={20} />
            </motion.button>
            
            <motion.button
              onClick={handleFavorite}
              className="bg-white/20 backdrop-blur-md rounded-full p-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart 
                className={`${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} 
                size={20} 
              />
            </motion.button>
          </div>
        </div>

        {/* VR Tour Button */}
        <motion.button
          onClick={handleVRTour}
          className="absolute bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Camera size={16} />
          <span className="text-sm font-medium">VR Tour</span>
        </motion.button>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4">
          <h1 className="text-2xl font-bold text-white mb-1">{destination.name}</h1>
          <div className="flex items-center text-white/90">
            <MapPin size={16} className="mr-1" />
            <span>{destination.state}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Rating and Quick Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Star className="text-yellow-400 mr-1" size={20} />
              <span className="font-bold text-lg">{destination.rating}</span>
              <span className="text-gray-600 ml-1">(128 reviews)</span>
            </div>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {destination.category}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Clock className="mx-auto text-gray-400 mb-1" size={20} />
              <p className="text-sm font-medium">Best Time</p>
              <p className="text-xs text-gray-600">Oct-Mar</p>
            </div>
            <div>
              <Users className="mx-auto text-gray-400 mb-1" size={20} />
              <p className="text-sm font-medium">Visitors</p>
              <p className="text-xs text-gray-600">2M+ yearly</p>
            </div>
            <div>
              <Thermometer className="mx-auto text-gray-400 mb-1" size={20} />
              <p className="text-sm font-medium">Climate</p>
              <p className="text-xs text-gray-600">Tropical</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-3">About</h2>
          <p className="text-gray-600 leading-relaxed">
            {destination.description}
          </p>
        </div>

        {/* Highlights */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Highlights</h2>
          <div className="space-y-2">
            {destination.highlights?.map((highlight, index) => (
              <div key={index} className="flex items-start">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <p className="text-gray-600">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        {destination.gallery && destination.gallery.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Gallery</h2>
            <div className="grid grid-cols-3 gap-2">
              {destination.gallery.slice(0, 6).map((image, index) => (
                <motion.img
                  key={index}
                  src={image}
                  alt={`${destination.name} ${index + 1}`}
                  className="aspect-square object-cover rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Book Tour Button */}
        <motion.button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-4 rounded-xl flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Calendar size={20} />
          <span>Book Your Visit</span>
        </motion.button>
      </div>
    </div>
  );
};

export default MobileDestinationDetails;