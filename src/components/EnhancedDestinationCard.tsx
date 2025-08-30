import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Share2, Eye, Calendar, MapPin, Clock, Users, Bookmark } from 'lucide-react';
import { Destination } from '../api/destinations';
import { useFavorites } from '../context/FavoritesContext';
import { useNotifications } from '../context/NotificationContext';

interface DestinationCardProps {
  destination: Destination;
  onViewDetails: (destination: Destination) => void;
  onVRExperience?: (destination: Destination) => void;
  className?: string;
}

const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  onViewDetails,
  onVRExperience,
  className = ''
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();
  const { showSuccess, showError } = useNotifications();
  
  const isFavorite = favorites.some(fav => fav.id === destination.id);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isFavorite) {
        await removeFromFavorites(destination.id);
        showSuccess('Removed from favorites');
      } else {
        await addToFavorites(destination);
        showSuccess('Added to favorites');
      }
    } catch (error) {
      showError('Failed to update favorites');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: destination.title,
          text: destination.description,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        showSuccess('Link copied to clipboard!');
      } catch (error) {
        showError('Failed to copy link');
      }
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
      onClick={() => onViewDetails(destination)}
    >
      {/* Image */}
      <div className=\"relative aspect-[4/3] overflow-hidden\">
        <motion.img
          src={destination.image}
          alt={destination.title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          } group-hover:scale-110`}
          onLoad={() => setIsImageLoaded(true)}
          loading=\"lazy\"
        />
        
        {/* Overlay */}
        <div className=\"absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300\" />
        
        {/* Action buttons */}
        <div className=\"absolute top-3 right-3 flex space-x-2\">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteToggle}
            className=\"p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors\"
          >
            <Heart className={`w-4 h-4 transition-colors ${
              isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'
            }`} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className=\"p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors\"
          >
            <Share2 className=\"w-4 h-4 text-gray-600\" />
          </motion.button>
        </div>
        
        {/* Category badge */}
        <div className=\"absolute top-3 left-3\">
          <span className=\"px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full\">
            {destination.category}
          </span>
        </div>
        
        {/* VR badge */}
        {destination.hasVR && (
          <div className=\"absolute bottom-3 right-3\">
            <span className=\"flex items-center space-x-1 px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full\">
              <Eye className=\"w-3 h-3\" />
              <span>360° VR</span>
            </span>
          </div>
        )}
        
        {/* Quick action buttons on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className=\"absolute bottom-3 left-3 flex space-x-2\"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(destination);
                }}
                className=\"px-3 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors\"
              >
                View Details
              </motion.button>
              
              {destination.hasVR && onVRExperience && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVRExperience(destination);
                  }}
                  className=\"px-3 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors\"
                >
                  VR Tour
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content */}
      <div className=\"p-6\">
        {/* Title and rating */}
        <div className=\"flex items-start justify-between mb-2\">
          <h3 className=\"text-lg font-semibold text-gray-900 group-hover:text-orange-500 transition-colors line-clamp-2\">
            {destination.title}
          </h3>
          <div className=\"flex items-center space-x-1 ml-2\">
            <Star className=\"w-4 h-4 text-yellow-400 fill-current\" />
            <span className=\"text-sm font-medium text-gray-700\">{destination.rating}</span>
          </div>
        </div>
        
        {/* Location */}
        <div className=\"flex items-center space-x-1 text-gray-500 mb-3\">
          <MapPin className=\"w-4 h-4\" />
          <span className=\"text-sm\">{destination.location}</span>
        </div>
        
        {/* Description */}
        <p className=\"text-gray-600 text-sm line-clamp-2 mb-4\">
          {destination.description}
        </p>
        
        {/* Meta info */}
        <div className=\"flex items-center justify-between text-sm text-gray-500\">
          <div className=\"flex items-center space-x-4\">
            <div className=\"flex items-center space-x-1\">
              <Clock className=\"w-4 h-4\" />
              <span>{destination.duration}</span>
            </div>
            
            {destination.groupSize && (
              <div className=\"flex items-center space-x-1\">
                <Users className=\"w-4 h-4\" />
                <span>{destination.groupSize}</span>
              </div>
            )}
          </div>
          
          {destination.price && (
            <div className=\"text-lg font-semibold text-orange-500\">
              ₹{destination.price.toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Tags */}
        {destination.tags && destination.tags.length > 0 && (
          <div className=\"flex flex-wrap gap-1 mt-3\">
            {destination.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className=\"px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md\"
              >
                {tag}
              </span>
            ))}
            {destination.tags.length > 3 && (
              <span className=\"px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md\">
                +{destination.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Booking button */}
      <div className=\"p-6 pt-0\">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            // Handle booking logic here
          }}
          className=\"w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl\"
        >
          Book Experience
        </motion.button>
      </div>
    </motion.div>
  );
};

export default DestinationCard;"