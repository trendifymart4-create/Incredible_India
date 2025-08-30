import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Star, Clock, Users, X } from 'lucide-react';
import { Destination } from '../api/destinations';

interface SearchFilterProps {
  destinations: Destination[];
  onFilter: (filtered: Destination[]) => void;
  className?: string;
}

const SearchAndFilter: React.FC<SearchFilterProps> = ({ destinations, onFilter, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const categories = [
    { id: 'all', name: 'All Categories', icon: MapPin },
    { id: 'historical', name: 'Historical', icon: Clock },
    { id: 'spiritual', name: 'Spiritual', icon: Star },
    { id: 'nature', name: 'Nature', icon: MapPin },
    { id: 'cultural', name: 'Cultural', icon: Users },
    { id: 'adventure', name: 'Adventure', icon: MapPin }
  ];

  const durations = [
    { id: 'all', name: 'Any Duration' },
    { id: 'short', name: '1-3 hours' },
    { id: 'medium', name: '4-6 hours' },
    { id: 'long', name: '7+ hours' }
  ];

  React.useEffect(() => {
    let filtered = [...destinations];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(dest => 
        dest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(dest => dest.category === selectedCategory);
    }

    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(dest => dest.rating >= selectedRating);
    }

    // Duration filter
    if (selectedDuration !== 'all') {
      const durationMap = {
        'short': [1, 3],
        'medium': [4, 6],
        'long': [7, 24]
      };
      const [min, max] = durationMap[selectedDuration as keyof typeof durationMap] || [0, 24];
      filtered = filtered.filter(dest => {
        const duration = parseInt(dest.duration.replace(/\\D/g, '')) || 1;
        return duration >= min && duration <= max;
      });
    }

    // Price filter
    filtered = filtered.filter(dest => {
      const price = dest.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    onFilter(filtered);
  }, [searchQuery, selectedCategory, selectedRating, selectedDuration, priceRange, destinations, onFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedRating(0);
    setSelectedDuration('all');
    setPriceRange([0, 10000]);
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== 'all',
    selectedRating > 0,
    selectedDuration !== 'all',
    priceRange[0] > 0 || priceRange[1] < 10000
  ].filter(Boolean).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className=\"relative\">
        <Search className=\"absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5\" />
        <input
          type=\"text\"
          placeholder=\"Search destinations, locations...\"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className=\"w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm\"
        />
      </div>

      {/* Filter Toggle */}
      <div className=\"flex items-center justify-between\">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className=\"flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors relative\"
        >
          <Filter className=\"w-4 h-4\" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className=\"absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center\">
              {activeFiltersCount}
            </span>
          )}
        </motion.button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className=\"text-sm text-orange-500 hover:text-orange-600 font-medium\"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className=\"overflow-hidden\"
          >
            <div className=\"bg-white border border-gray-200 rounded-xl p-6 space-y-6\">
              {/* Categories */}
              <div>
                <h3 className=\"font-semibold text-gray-900 mb-3\">Category</h3>
                <div className=\"grid grid-cols-2 md:grid-cols-3 gap-2\">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${
                          selectedCategory === category.id
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className=\"w-4 h-4\" />
                        <span className=\"text-sm font-medium\">{category.name}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className=\"font-semibold text-gray-900 mb-3\">Minimum Rating</h3>
                <div className=\"flex space-x-2\">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedRating(rating === selectedRating ? 0 : rating)}
                      className=\"flex items-center space-x-1 p-2 rounded-lg border transition-all\"
                    >
                      <Star className={`w-4 h-4 ${
                        rating <= selectedRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} />
                      <span className=\"text-sm\">{rating}+</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <h3 className=\"font-semibold text-gray-900 mb-3\">Duration</h3>
                <div className=\"grid grid-cols-2 gap-2\">
                  {durations.map((duration) => (
                    <motion.button
                      key={duration.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDuration(duration.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedDuration === duration.id
                          ? 'bg-orange-50 border-orange-500 text-orange-700'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className=\"text-sm font-medium\">{duration.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className=\"font-semibold text-gray-900 mb-3\">Price Range (₹)</h3>
                <div className=\"space-y-4\">
                  <div className=\"flex items-center space-x-4\">
                    <input
                      type=\"range\"
                      min={0}
                      max={10000}
                      step={500}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className=\"flex-1\"
                    />
                    <span className=\"text-sm font-medium min-w-16\">₹{priceRange[0]}</span>
                  </div>
                  <div className=\"flex items-center space-x-4\">
                    <input
                      type=\"range\"
                      min={0}
                      max={10000}
                      step={500}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className=\"flex-1\"
                    />
                    <span className=\"text-sm font-medium min-w-16\">₹{priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchAndFilter;"