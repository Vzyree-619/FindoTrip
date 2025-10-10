import { useState, useRef, useEffect } from 'react';
import { Link } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { 
  Car, 
  Users, 
  Fuel, 
  Settings, 
  Star, 
  MapPin, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2
} from 'lucide-react';
import { cn } from '~/lib/utils';

function vehiclesDefault() {
  return [
  {
    id: 1,
    name: 'Toyota Prado',
    type: 'SUV',
    seats: 7,
    fuel: 'Petrol',
    transmission: 'Automatic',
    price: 15000,
    currency: 'PKR',
    rating: 4.8,
    reviews: 124,
    image: '/prado.png',
    features: ['AC', 'GPS', 'Bluetooth', 'Backup Camera'],
    location: 'Karachi',
    available: true,
    discount: 10,
  },
  {
    id: 2,
    name: 'Toyota Corolla GLI',
    type: 'Sedan',
    seats: 5,
    fuel: 'Petrol',
    transmission: 'Automatic',
    price: 8000,
    currency: 'PKR',
    rating: 4.6,
    reviews: 89,
    image: '/car.jpg',
    features: ['AC', 'GPS', 'Bluetooth'],
    location: 'Lahore',
    available: true,
    discount: 0,
  },
  {
    id: 3,
    name: 'Toyota Hiace',
    type: 'Van',
    seats: 12,
    fuel: 'Diesel',
    transmission: 'Manual',
    price: 12000,
    currency: 'PKR',
    rating: 4.7,
    reviews: 67,
    image: '/van.jpg',
    features: ['AC', 'GPS', 'Extra Space'],
    location: 'Islamabad',
    available: true,
    discount: 5,
  },
  {
    id: 4,
    name: 'Honda Civic',
    type: 'Sedan',
    seats: 5,
    fuel: 'Petrol',
    transmission: 'Automatic',
    price: 9000,
    currency: 'PKR',
    rating: 4.5,
    reviews: 156,
    image: '/car.jpg',
    features: ['AC', 'GPS', 'Bluetooth', 'Sunroof'],
    location: 'Karachi',
    available: false,
    discount: 0,
  },
  {
    id: 5,
    name: 'Suzuki Swift',
    type: 'Hatchback',
    seats: 5,
    fuel: 'Petrol',
    transmission: 'Manual',
    price: 6000,
    currency: 'PKR',
    rating: 4.4,
    reviews: 98,
    image: '/car.jpg',
    features: ['AC', 'GPS'],
    location: 'Lahore',
    available: true,
    discount: 15,
  },
  {
    id: 6,
    name: 'Toyota Land Cruiser',
    type: 'SUV',
    seats: 8,
    fuel: 'Petrol',
    transmission: 'Automatic',
    price: 25000,
    currency: 'PKR',
    rating: 4.9,
    reviews: 45,
    image: '/prado.png',
    features: ['AC', 'GPS', 'Bluetooth', '4WD', 'Premium Sound'],
    location: 'Islamabad',
    available: true,
    discount: 0,
  },
  ];
}

export default function CarRentalSection({ vehicles = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Normalize incoming data to a safe array
  const provided = Array.isArray(vehicles) ? vehicles : [];
  
  // Transform database vehicles to CarRentalSection format
  const transformedVehicles = provided.map(vehicle => ({
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.category || 'Car',
    seats: vehicle.specs?.passengers || 5,
    fuel: vehicle.fuelType || 'Petrol',
    transmission: vehicle.transmission || 'Automatic',
    price: vehicle.price || 0,
    currency: 'PKR',
    rating: vehicle.rating || 0,
    reviews: vehicle.reviewCount || 0,
    image: vehicle.images?.[0] || '/car.jpg',
    features: vehicle.features || [],
    location: vehicle.location || '',
    available: vehicle.availability === 'Available',
    discount: 0,
  }));
  
  const displayVehicles = transformedVehicles.length > 0 ? transformedVehicles : vehiclesDefault();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const itemsPerView = 3;
  const maxIndex = Math.max(0, (displayVehicles.length || 6) - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  const toggleFavorite = (vehicleId: number) => {
    setFavorites(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      const cardWidth = 320; // Approximate card width + gap
      scrollRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <section className="py-16 px-4 md:px-8 lg:px-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E]/10 text-[#01502E] rounded-full text-sm font-medium mb-4">
            <Car className="h-4 w-4" />
            <span>Chauffeured Vehicles</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Ride with Driver
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our premium fleet with professional drivers for a safe and comfortable journey across Pakistan.
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="h-10 w-10 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex space-x-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  index === currentIndex ? "bg-[#01502E] w-8" : "bg-gray-300"
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex === maxIndex}
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Car Cards */}
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-6 overflow-x-auto scrollbar-hide pb-4",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayVehicles.length === 0 ? (
            <div className="w-full text-center text-gray-600 py-10">
              No vehicles available right now. Please check back later or view all vehicles.
            </div>
          ) : displayVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="min-w-[300px] max-w-[320px] group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="p-0">
                <div className="relative">
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {vehicle.discount > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        {vehicle.discount}% OFF
                      </Badge>
                    )}
                    <Badge className={vehicle.available ? "bg-[#01502E] text-white" : "bg-orange-600 text-white"}>
                      {vehicle.available ? "Available" : "Booked"}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(vehicle.id)}
                    >
                      <Heart 
                        className={cn(
                          "h-4 w-4",
                          favorites.includes(vehicle.id) ? "fill-red-500 text-red-500" : "text-gray-600"
                        )} 
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                    >
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Vehicle Info */}
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                      {vehicle.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{vehicle.location}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(vehicle.rating)
                              ? "fill-orange-400 text-orange-400"
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {vehicle.rating} ({vehicle.reviews} reviews)
                    </span>
                  </div>

                  {/* Vehicle Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{vehicle.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-gray-500" />
                      <span>{vehicle.fuel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span>{vehicle.type}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {vehicle.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <div className="w-full space-y-3">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#01502E]">
                        {vehicle.currency} {vehicle.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">/day (with driver)</span>
                    </div>
                    {vehicle.discount > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">
                          {vehicle.currency} {(vehicle.price / (1 - vehicle.discount / 100)).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button asChild className="flex-1 bg-[#01502E] hover:bg-[#013d23] text-white" disabled={!vehicle.available}>
                      <Link to={`/vehicle/${vehicle.id}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {vehicle.available ? "Book Now" : "Unavailable"}
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="border-[#01502E] text-[#01502E] hover:bg-[#01502E]/10">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button asChild size="lg" variant="outline" className="px-8">
            <Link to="/vehicles">
              View All Vehicles
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </section>
  );
}
