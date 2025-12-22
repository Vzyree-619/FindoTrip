import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Thermometer, Eye, Gauge, Navigation, Search, RefreshCw, MapPin, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { Form, useNavigate } from "@remix-run/react";

// Weather condition icons mapping
const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
    return <CloudRain className="w-12 h-12 text-blue-500" />;
  } else if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
    return <CloudSnow className="w-12 h-12 text-gray-300" />;
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className="w-12 h-12 text-gray-400" />;
  } else if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return <Sun className="w-12 h-12 text-yellow-500" />;
  } else {
    return <Cloud className="w-12 h-12 text-gray-400" />;
  }
};

// Fetch weather data from free API (server-side)
async function fetchWeatherData(location: string = "Skardu, Pakistan") {
  try {
    // Using wttr.in - a free weather API that doesn't require an API key
    // It provides weather data in JSON format
    // Adding ?lang=en to force English language output
    const encodedLocation = encodeURIComponent(location);
    const response = await fetch(`https://wttr.in/${encodedLocation}?format=j1&lang=en`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FindoTrip/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    
    // Parse wttr.in response format
    const current = data.current_condition?.[0];
    const today = data.weather?.[0];
    
    if (!current || !today) {
      throw new Error('Invalid weather data format');
    }

    return {
      location: data.nearest_area?.[0]?.areaName?.[0]?.value || location,
      country: data.nearest_area?.[0]?.country?.[0]?.value || 'Pakistan',
      condition: current.weatherDesc?.[0]?.value || 'Unknown',
      temperature: parseInt(current.temp_C) || 0,
      feelsLike: parseInt(current.FeelsLikeC) || 0,
      humidity: parseInt(current.humidity) || 0,
      windSpeed: parseFloat(current.windspeedKmph) || 0,
      windDirection: current.winddir16Point || 'N',
      pressure: parseFloat(current.pressure) || 0,
      visibility: parseFloat(current.visibility) || 0,
      uvIndex: parseInt(current.uvIndex) || 0,
      sunrise: today.astronomy?.[0]?.sunrise || 'N/A',
      sunset: today.astronomy?.[0]?.sunset || 'N/A',
      hourly: today.hourly?.slice(0, 6) || [],
      forecast: data.weather?.slice(0, 5) || [],
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const location = url.searchParams.get("location") || "Skardu, Pakistan";
  
  const weatherData = await fetchWeatherData(location);
  
  return json({
    weather: weatherData,
    location: location,
  });
}

interface LocationSuggestion {
  displayName: string;
  fullName: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

export default function WeatherPage() {
  const { weather, location: initialLocation } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isLoading = navigation.state === "loading";

  useEffect(() => {
    setSearchLocation(initialLocation);
  }, [initialLocation]);

  // Debounced search for suggestions
  useEffect(() => {
    if (searchLocation.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/weather/suggestions?q=${encodeURIComponent(searchLocation)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(data.suggestions && data.suggestions.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchLocation]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setSearchLocation(suggestion.displayName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Navigate to update the weather
    navigate(`/weather?location=${encodeURIComponent(suggestion.displayName)}`);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01502E]/5 via-white to-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Weather Forecast</h1>
          <p className="text-gray-600">Get real-time weather information for any location</p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Form method="get" className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Label htmlFor="location" className="mb-2 block">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="location"
                    name="location"
                    type="text"
                    value={searchLocation}
                    onChange={(e) => {
                      setSearchLocation(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter city name (e.g., Skardu, Pakistan)"
                    className="w-full"
                    autoComplete="off"
                  />
                  {isLoadingSuggestions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-1 bg-white"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-100
                            index === selectedIndex ? 'bg-gray-100' : ''
                          } ${index === 0 ? 'rounded-t-lg' : ''} ${
                            index === suggestions.length - 1 ? 'rounded-b-lg' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {suggestion.displayName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {suggestion.fullName}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#01502E] hover:bg-[#013d23] text-white w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Weather Display */}
        {weather ? (
          <div className="space-y-6">
            {/* Current Weather Card */}
            <Card className="bg-gradient-to-br from-[#01502E] to-[#013d23] text-white">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center gap-6 mb-4 md:mb-0">
                    <div className="text-6xl">
                      {getWeatherIcon(weather.condition)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        {weather.location}, {weather.country}
                      </h2>
                      <p className="text-green-100 text-lg capitalize">{weather.condition}</p>
                      <p className="text-5xl font-bold mt-2">
                        {weather.temperature}°C
                      </p>
                      <p className="text-green-100 text-sm">
                        Feels like {weather.feelsLike}°C
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <Droplets className="w-5 h-5 mx-auto mb-1 text-green-200" />
                      <p className="text-sm text-green-100">Humidity</p>
                      <p className="text-xl font-semibold">{weather.humidity}%</p>
                    </div>
                    <div>
                      <Wind className="w-5 h-5 mx-auto mb-1 text-green-200" />
                      <p className="text-sm text-green-100">Wind</p>
                      <p className="text-xl font-semibold">{weather.windSpeed} km/h</p>
                    </div>
                    <div>
                      <Gauge className="w-5 h-5 mx-auto mb-1 text-green-200" />
                      <p className="text-sm text-green-100">Pressure</p>
                      <p className="text-xl font-semibold">{weather.pressure} mb</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="text-2xl font-bold">{weather.temperature}°C</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-8 h-8 text-[#01502E]" />
                    <div>
                      <p className="text-sm text-gray-600">Humidity</p>
                      <p className="text-2xl font-bold">{weather.humidity}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Wind className="w-8 h-8 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Wind Speed</p>
                      <p className="text-2xl font-bold">{weather.windSpeed} km/h</p>
                      <p className="text-xs text-gray-500">{weather.windDirection}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600">Visibility</p>
                      <p className="text-2xl font-bold">{weather.visibility} km</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sunrise & Sunset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-yellow-500" />
                        <span className="text-gray-700">Sunrise</span>
                      </div>
                      <span className="font-semibold">{weather.sunrise}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700">Sunset</span>
                      </div>
                      <span className="font-semibold">{weather.sunset}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">UV Index</span>
                      <span className="font-semibold">{weather.uvIndex}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Pressure</span>
                      <span className="font-semibold">{weather.pressure} mb</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Feels Like</span>
                      <span className="font-semibold">{weather.feelsLike}°C</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Forecast (if available) */}
            {weather.forecast && weather.forecast.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">5-Day Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {weather.forecast.map((day: any, index: number) => {
                      const date = day.date || '';
                      const maxTemp = day.maxtempC || 'N/A';
                      const minTemp = day.mintempC || 'N/A';
                      const condition = day.weatherDesc?.[0]?.value || 'Unknown';
                      
                      return (
                        <div
                          key={index}
                          className="text-center p-4 bg-gray-50 rounded-lg"
                        >
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            {index === 0 ? 'Today' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </p>
                          <div className="mb-2 flex justify-center">
                            {getWeatherIcon(condition)}
                          </div>
                          <p className="text-xs text-gray-600 capitalize mb-2">{condition}</p>
                          <div className="flex justify-center gap-2">
                            <span className="text-lg font-bold">{maxTemp}°</span>
                            <span className="text-gray-400">{minTemp}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Cloud className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Weather data not available
              </h3>
              <p className="text-gray-500 mb-4">
                Unable to fetch weather information for "{initialLocation}". Please try a different location.
              </p>
              <p className="text-sm text-gray-400">
                Try searching for: "Skardu, Pakistan", "Islamabad, Pakistan", or "Lahore, Pakistan"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-[#01502E]/5 border-[#01502E]/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#01502E] mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#01502E] mb-2">About Weather Data</h3>
                <p className="text-gray-700 text-sm">
                  Weather information is provided by wttr.in, a free weather service. 
                  Data is updated in real-time and includes current conditions, temperature, 
                  humidity, wind speed, and a 5-day forecast. You can search for any city 
                  worldwide by entering the city name and country.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

