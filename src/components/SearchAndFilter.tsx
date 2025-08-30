import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, DollarSign, X, SlidersHorizontal } from 'lucide-react';

export interface SearchFilters {
  searchTerm: string;
  location: string;
  minRating: number;
  priceRange: {
    min: number;
    max: number;
  };
  vrAvailable: boolean | null;
  duration: string;
}

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  locations: string[];
  isLoading?: boolean;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  locations,
  isLoading = false
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const updatedPriceRange = { ...localFilters.priceRange, [type]: value };
    handleFilterChange('priceRange', updatedPriceRange);
  };

  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      searchTerm: '',
      location: '',
      minRating: 0,
      priceRange: { min: 0, max: 10000 },
      vrAvailable: null,
      duration: ''
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      localFilters.searchTerm !== '' ||
      localFilters.location !== '' ||
      localFilters.minRating > 0 ||
      localFilters.priceRange.min > 0 ||
      localFilters.priceRange.max < 10000 ||
      localFilters.vrAvailable !== null ||
      localFilters.duration !== ''
    );
  };

  const durations = [
    { value: '', label: 'Any Duration' },
    { value: '1-3 hours', label: '1-3 hours' },
    { value: '4-6 hours', label: '4-6 hours' },
    { value: '1 day', label: 'Full Day' },
    { value: '2-3 days', label: '2-3 days' },
    { value: '1 week', label: 'Week Long' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Search Bar */}
      <div className="p-6 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search destinations, locations, or experiences..."
            value={localFilters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-400 text-lg"
            disabled={isLoading}
          />
          {localFilters.searchTerm && (
            <button
              onClick={() => handleFilterChange('searchTerm', '')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters() && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location
              </label>
              <select
                value={localFilters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Star className="inline w-4 h-4 mr-1" />
                Minimum Rating
              </label>
              <select
                value={localFilters.minRating}
                onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={localFilters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>

            {/* VR Available Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VR Experience
              </label>
              <select
                value={localFilters.vrAvailable === null ? '' : String(localFilters.vrAvailable)}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : e.target.value === 'true';
                  handleFilterChange('vrAvailable', value);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">All Experiences</option>
                <option value="true">VR Available</option>
                <option value="false">No VR</option>
              </select>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <input
                  type="number"
                  placeholder="Min price"
                  value={localFilters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isLoading}
                  min={0}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max price"
                  value={localFilters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={isLoading}
                  min={localFilters.priceRange.min}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
