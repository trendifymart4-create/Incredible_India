import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDestination, type Destination } from '../api/destinations';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import Reviews from './Reviews';
import { SkeletonDestination } from './SkeletonLoader';

interface DestinationDetailsProps {
  onVRExperience: (destination: Destination) => void;
}

const DestinationDetails: React.FC<DestinationDetailsProps> = ({ onVRExperience }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-header pb-nav md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonDestination />
          <SkeletonDestination />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{destination.name}</h1>
          <p className="text-gray-700 mb-6">{destination.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Highlights</h2>
              <ul className="space-y-2">
                {destination.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-orange-500">•</span>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Location:</span>
                  <span>{destination.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Duration:</span>
                  <span>{destination.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Rating:</span>
                  <span>{destination.rating}/5</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Visitors:</span>
                  <span>{destination.visitors}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => onVRExperience(destination)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Experience in VR
            </button>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h2>
          <Reviews destinationId={destination.id} />
        </div>
      </div>
    </div>
  );
};

export default DestinationDetails;