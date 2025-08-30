import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, TrendingUp, MapPin } from 'lucide-react';
import { Destination } from '../../api/destinations';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: Destination[];
}

const MobileSearch: React.FC<MobileSearchProps> = ({
  isOpen,
  onClose,
  destinations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches] = useState([
    'Taj Mahal',
    'Kerala Backwaters',
    'Goa Beaches',
    'Rajasthan Forts'
  ]);

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trendingSearches = ['Golden Triangle', 'Hill Stations', 'Beach Destinations', 'Heritage Sites'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-white z-50"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <button
              onClick={onClose}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchTerm ? (
              <div className="p-4">
                <p className="text-gray-600 mb-4">
                  {filteredDestinations.length} results for "{searchTerm}"
                </p>
                <div className="space-y-3">
                  {filteredDestinations.map((destination) => (
                    <motion.div
                      key={destination.id}
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-12 h-12 object-cover rounded-lg mr-3"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{destination.name}</h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={12} className="mr-1" />
                          {destination.state}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Clock className="text-gray-400 mr-2" size={18} />
                      <h2 className="font-medium text-gray-800">Recent Searches</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setSearchTerm(search)}
                          className="px-3 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {search}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="text-gray-400 mr-2" size={18} />
                    <h2 className="font-medium text-gray-800">Trending</h2>
                  </div>
                  <div className="space-y-2">
                    {trendingSearches.map((search, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSearchTerm(search)}
                        className="flex items-center w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Search className="text-gray-400 mr-3" size={16} />
                        <span className="text-gray-800">{search}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Popular Destinations */}
                <div>
                  <h2 className="font-medium text-gray-800 mb-3">Popular Destinations</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {destinations.slice(0, 6).map((destination) => (
                      <motion.div
                        key={destination.id}
                        className="bg-gray-50 rounded-lg overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={destination.image}
                          alt={destination.name}
                          className="w-full h-20 object-cover"
                        />
                        <div className="p-2">
                          <p className="font-medium text-sm text-gray-800 truncate">
                            {destination.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {destination.state}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileSearch;