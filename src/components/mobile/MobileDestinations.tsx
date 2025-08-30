import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Camera, Star, Filter, Search, Grid, List } from 'lucide-react';
import { Destination } from '../../api/destinations';
import { useHaptics } from '../../hooks/useHaptics';

interface MobileDestinationsProps {
  destinations: Destination[];
  loading: boolean;
  onDestinationSelect: (destination: Destination) => void;
  onVRExperience: (destination: Destination) => void;
}

const MobileDestinations: React.FC<MobileDestinationsProps> = ({
  destinations,
  loading,
  onDestinationSelect,
  onVRExperience,
}) => {
  const { triggerHaptic } = useHaptics();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'heritage' | 'nature' | 'adventure'>('all');

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dest.state.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && dest.category === selectedFilter;
  });

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
      <div className="pt-16 pb-20 px-4 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-300 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Destinations</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'heritage', label: 'Heritage' },
              { key: 'nature', label: 'Nature' },
              { key: 'adventure', label: 'Adventure' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFilter === filter.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              {filteredDestinations.length} destinations found
            </span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Destinations Grid/List */}
      <div className="px-4 py-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDestinationTap(destination)}
              >
                <div className="relative h-32">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => handleVRTap(destination, e)}
                    className="absolute top-2 right-2 bg-white/20 backdrop-blur-md rounded-full p-1.5"
                  >
                    <Camera className="text-white" size={16} />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-1">
                    {destination.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      {destination.state}
                    </div>
                    <div className="flex items-center">
                      <Star size={12} className="mr-1 text-yellow-400" />
                      {destination.rating}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleDestinationTap(destination)}
              >
                <div className="flex">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {destination.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin size={14} className="mr-1" />
                          {destination.state}
                        </div>
                        <div className="flex items-center">
                          <Star size={14} className="mr-1 text-yellow-400" />
                          <span className="text-sm font-medium">{destination.rating}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleVRTap(destination, e)}
                        className="bg-orange-100 p-2 rounded-full"
                      >
                        <Camera className="text-orange-500" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileDestinations;