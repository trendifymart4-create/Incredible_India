import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  Play, 
  Heart, 
  Share2, 
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDestination, type Destination } from '../api/destinations';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import Reviews from './Reviews';
import { useTranslation } from '../context/TranslationContext';
import { SkeletonDestination } from './SkeletonLoader';

interface DestinationDetailsProps {
  onVRExperience: (destination: Destination) => void;
}

const DestinationDetails: React.FC<DestinationDetailsProps> = ({ onVRExperience }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { checkIfDestinationFavorited, toggleDestinationFavorite } = useFavorites();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchDestination = async () => {
      if (!id) {
        setError('No destination ID provided');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const dest = await getDestination(id);
        if (dest) {
          setDestination(dest);
          setIsFavorite(checkIfDestinationFavorited(id));
        } else {
          setError('Destination not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load destination');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDestination();
  }, [id, checkIfDestinationFavorited]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please sign in to add favorites');
      return;
    }
    
    if (!destination) return;
    
    try {
      await toggleDestinationFavorite(destination.id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to update favorites. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!destination) return;
    
    try {
      await navigator.share({
        title: destination.name,
        text: `Check out ${destination.name} on Incredible India VR!`,
        url: window.location.href
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy link:', clipboardError);
        alert('Failed to share. Please copy the URL manually.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-header pb-nav md:pb-0">
        <div className="sticky top-header z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SkeletonDestination />
              <SkeletonDestination />
            </div>
            
            <div className="space-y-6">
              <SkeletonDestination />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen bg-white pt-header pb-nav md:pb-0 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Destination</h2>
          <p className="text-gray-600 mb-6">{error || 'Destination not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-header pb-nav md:pb-0">
      {/* Back Button */}
      <div className="sticky top-header z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-2">
                  {destination.name}
                </h1>
                <div className="flex items-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{destination.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{destination.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleToggleFavorite}
                  className={`p-3 rounded-full backdrop-blur-sm transition-all ${
                    isFavorite
                      ? 'bg-red-500/80 text-white hover:bg-red-600/90'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all"
                  title="Share this destination"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About {destination.name}</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                {destination.description}
              </p>
              
              {/* Highlights */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Highlights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="mt-1 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">{destination.duration}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600">Visitors</p>
                  <p className="font-semibold text-gray-900">{destination.visitors}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <Star className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="font-semibold text-gray-900">{destination.rating}/5</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                    <Star className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-sm text-gray-600">Photos</p>
                  <p className="font-semibold text-gray-900">24+</p>
                </div>
              </div>
            
            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Reviews destinationId={destination.id} />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* VR Experience Card */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 text-white">
                <h3 className="text-xl font-bold mb-2">VR Experience</h3>
                <p className="text-orange-100 mb-4">
                  Explore {destination.name} in stunning 360° virtual reality
                </p>
                
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(destination.rating)
                            ? 'text-yellow-300 fill-current'
                            : 'text-orange-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm">({destination.rating}/5)</span>
                </div>
                
                <button
                  onClick={() => onVRExperience(destination)}
                  className="w-full bg-white text-orange-600 hover:bg-gray-100 font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Experience in VR</span>
                </button>
              </div>
            </div>
            
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Your Visit</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option>1 Guest</option>
                    <option>2 Guests</option>
                    <option>3 Guests</option>
                    <option>4+ Guests</option>
                  </select>
                </div>
                
                <div className="pt-2">
                  <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all">
                    Book Now - ₹{Math.floor(Math.random() * 5000) + 2000}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationDetails;