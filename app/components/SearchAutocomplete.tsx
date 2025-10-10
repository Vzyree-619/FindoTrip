import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Clock, Users, TrendingUp, History, Star } from "lucide-react";

// ========================================
// TYPESCRIPT INTERFACES
// ========================================

interface SearchSuggestion {
  id: string;
  type: 'location' | 'property' | 'vehicle' | 'tour' | 'recent' | 'popular';
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  category?: string;
  rating?: number;
  price?: number;
  distance?: number;
  isVerified?: boolean;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  serviceType?: 'accommodations' | 'vehicles' | 'tours' | 'packages';
  showRecent?: boolean;
  showPopular?: boolean;
  maxSuggestions?: number;
}

// ========================================
// MOCK DATA (In production, this would come from API)
// ========================================

const mockSuggestions: SearchSuggestion[] = [
  // Locations
  {
    id: 'loc-1',
    type: 'location',
    title: 'New York City',
    subtitle: 'New York, United States',
    icon: MapPin,
    category: 'City'
  },
  {
    id: 'loc-2',
    type: 'location',
    title: 'Paris',
    subtitle: 'France',
    icon: MapPin,
    category: 'City'
  },
  {
    id: 'loc-3',
    type: 'location',
    title: 'Tokyo',
    subtitle: 'Japan',
    icon: MapPin,
    category: 'City'
  },
  {
    id: 'loc-4',
    type: 'location',
    title: 'London',
    subtitle: 'United Kingdom',
    icon: MapPin,
    category: 'City'
  },
  {
    id: 'loc-5',
    type: 'location',
    title: 'Sydney',
    subtitle: 'Australia',
    icon: MapPin,
    category: 'City'
  },
  
  // Properties
  {
    id: 'prop-1',
    type: 'property',
    title: 'Luxury Beachfront Villa',
    subtitle: 'Malibu, California',
    icon: MapPin,
    category: 'Villa',
    rating: 4.8,
    price: 450,
    isVerified: true
  },
  {
    id: 'prop-2',
    type: 'property',
    title: 'Downtown Apartment',
    subtitle: 'Manhattan, New York',
    icon: MapPin,
    category: 'Apartment',
    rating: 4.6,
    price: 200,
    isVerified: true
  },
  
  // Vehicles
  {
    id: 'veh-1',
    type: 'vehicle',
    title: 'BMW X5',
    subtitle: 'Luxury SUV',
    icon: MapPin,
    category: 'SUV',
    rating: 4.7,
    price: 120,
    isVerified: true
  },
  {
    id: 'veh-2',
    type: 'vehicle',
    title: 'Tesla Model 3',
    subtitle: 'Electric Sedan',
    icon: MapPin,
    category: 'Electric',
    rating: 4.9,
    price: 150,
    isVerified: true
  },
  
  // Tours
  {
    id: 'tour-1',
    type: 'tour',
    title: 'City Walking Tour',
    subtitle: 'Paris, France',
    icon: MapPin,
    category: 'Cultural',
    rating: 4.8,
    price: 45,
    isVerified: true
  },
  {
    id: 'tour-2',
    type: 'tour',
    title: 'Food Tour Experience',
    subtitle: 'Tokyo, Japan',
    icon: MapPin,
    category: 'Food',
    rating: 4.9,
    price: 65,
    isVerified: true
  }
];

const popularSearches = [
  'Beachfront properties',
  'Luxury cars',
  'City tours',
  'Mountain cabins',
  'Adventure tours',
  'Downtown apartments',
  'SUV rentals',
  'Food tours',
  'Historic sites',
  'Electric vehicles'
];

const recentSearches = [
  'Downtown apartments',
  'SUV rentals',
  'Food tours',
  'Beach houses',
  'Luxury cars'
];

// ========================================
// SEARCH AUTOCOMPLETE COMPONENT
// ========================================

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search destinations, properties, vehicles, or tours...",
  serviceType = 'accommodations',
  showRecent = true,
  showPopular = true,
  maxSuggestions = 8
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    const timeout = setTimeout(() => {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.title.toLowerCase().includes(value.toLowerCase()) ||
        suggestion.subtitle?.toLowerCase().includes(value.toLowerCase())
      );
      
      setSuggestions(filtered.slice(0, maxSuggestions));
      setIsOpen(true);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeout);
  }, [value, maxSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onSelect(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get suggestion icon
  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    if (suggestion.icon) {
      const Icon = suggestion.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Search className="w-4 h-4" />;
  };

  // Get suggestion color
  const getSuggestionColor = (suggestion: SearchSuggestion) => {
    const colors = {
      location: 'text-[#01502E]',
      property: 'text-[#01502E]',
      vehicle: 'text-orange-600',
      tour: 'text-[#01502E]',
      recent: 'text-gray-600',
      popular: 'text-orange-600'
    };
    return colors[suggestion.type] || 'text-gray-600';
  };

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#01502E]"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionSelect(suggestion)}
          className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
            index === selectedIndex ? 'bg-[#01502E]/10' : ''
          }`}
                >
                  <div className={`${getSuggestionColor(suggestion)}`}>
                    {getSuggestionIcon(suggestion)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-sm text-gray-500 truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                    {suggestion.category && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {suggestion.category}
                        </span>
                        {suggestion.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-gray-500">
                              {suggestion.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {suggestion.price && (
                          <span className="text-xs text-gray-500">
                            ${suggestion.price}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {suggestion.isVerified && (
                    <div className="text-[#01502E]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && value.trim() === '' && recentSearches.length > 0 && (
            <div className="border-t border-gray-200 py-2">
              <div className="px-4 py-2 text-sm font-medium text-gray-700 flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>Recent searches</span>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange(search);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm text-gray-600"
                >
                  <History className="w-4 h-4 text-gray-400" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {showPopular && value.trim() === '' && popularSearches.length > 0 && (
            <div className="border-t border-gray-200 py-2">
              <div className="px-4 py-2 text-sm font-medium text-gray-700 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Popular searches</span>
              </div>
              {popularSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange(search);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm text-gray-600"
                >
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {value.trim() !== '' && suggestions.length === 0 && !isLoading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No results found for "{value}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React from 'react';
