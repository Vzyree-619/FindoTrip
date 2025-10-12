import { useState, useEffect } from 'react';
import { useNavigate, useActionData } from '@remix-run/react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Car, 
  Hotel, 
  Plane, 
  Activity,
  ChevronDown,
  Clock,
  User,
  Baby
} from 'lucide-react';
import { cn } from '~/lib/utils';

interface SearchFormProps {
  className?: string;
}

interface SearchResults {
  accommodations: any[];
  vehicles: any[];
  tours: any[];
}

export default function SearchForm({ className }: SearchFormProps) {
  const navigate = useNavigate();
  const actionData = useActionData();
  const [activeTab, setActiveTab] = useState('accommodations');
  const [searchResults, setSearchResults] = useState<SearchResults>({ accommodations: [], vehicles: [], tours: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Form states
  const [accommodationForm, setAccommodationForm] = useState({
    destination: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    infants: 0,
    rooms: 1
  });

  const [vehicleForm, setVehicleForm] = useState({
    pickupLocation: '',
    pickupDate: '',
    returnDate: '',
    pickupTime: '10:00',
    returnTime: '10:00'
  });

  const [tourForm, setTourForm] = useState({
    destination: '',
    tourDate: '',
    guests: 2,
    tourType: ''
  });

  const [activityForm, setActivityForm] = useState({
    location: '',
    activityDate: '',
    guests: 2,
    activityType: ''
  });

  // Handle accommodation search
  const handleAccommodationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      if (accommodationForm.destination) {
        // Use smart search that searches both name and city
        params.set('search', accommodationForm.destination);
      }
      if (accommodationForm.checkIn) params.set('checkIn', accommodationForm.checkIn);
      if (accommodationForm.checkOut) params.set('checkOut', accommodationForm.checkOut);
      if (accommodationForm.adults) params.set('adults', accommodationForm.adults.toString());
      if (accommodationForm.children) params.set('children', accommodationForm.children.toString());
      if (accommodationForm.rooms) params.set('rooms', accommodationForm.rooms.toString());

      // Navigate to accommodations search page
      navigate(`/accommodations?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle vehicle search
  const handleVehicleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      if (vehicleForm.pickupLocation) params.set('location', vehicleForm.pickupLocation);
      if (vehicleForm.pickupDate) params.set('pickupDate', vehicleForm.pickupDate);
      if (vehicleForm.returnDate) params.set('returnDate', vehicleForm.returnDate);
      if (vehicleForm.pickupTime) params.set('pickupTime', vehicleForm.pickupTime);

      // Navigate to vehicles page
      navigate(`/vehicles?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle tour search
  const handleTourSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      if (tourForm.destination) params.set('destination', tourForm.destination);
      if (tourForm.tourDate) params.set('date', tourForm.tourDate);
      if (tourForm.guests) params.set('guests', tourForm.guests.toString());
      if (tourForm.tourType) params.set('type', tourForm.tourType);

      // Navigate to tours page
      navigate(`/tours?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle activity search
  const handleActivitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const params = new URLSearchParams();
      if (activityForm.location) params.set('location', activityForm.location);
      if (activityForm.activityDate) params.set('date', activityForm.activityDate);
      if (activityForm.guests) params.set('guests', activityForm.guests.toString());
      if (activityForm.activityType) params.set('type', activityForm.activityType);

      // Navigate to activities page (you can create this route)
      navigate(`/activities?${params.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    setAccommodationForm(prev => ({
      ...prev,
      checkIn: formatDate(tomorrow),
      checkOut: formatDate(dayAfter)
    }));

    setVehicleForm(prev => ({
      ...prev,
      pickupDate: formatDate(tomorrow),
      returnDate: formatDate(dayAfter)
    }));

    setTourForm(prev => ({
      ...prev,
      tourDate: formatDate(tomorrow)
    }));

    setActivityForm(prev => ({
      ...prev,
      activityDate: formatDate(tomorrow)
    }));
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* Hero Background */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden rounded-2xl">
        <img 
          src="/landingPageImg.jpg" 
          alt="Beautiful Pakistan Landscape" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Amazing
              <span className="text-[#01502E] block">Pakistan</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Find the perfect stay, rent a car, or book an unforgettable tour
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="relative -mt-16 md:-mt-20 z-10 px-4">
        <Card className="max-w-6xl mx-auto shadow-2xl border-0">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="accommodations" className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  <span className="hidden sm:inline">Stays</span>
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="hidden sm:inline">Cars</span>
                </TabsTrigger>
                <TabsTrigger value="tours" className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  <span className="hidden sm:inline">Tours</span>
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Activities</span>
                </TabsTrigger>
              </TabsList>

              {/* Accommodations Tab */}
              <TabsContent value="accommodations">
                <form onSubmit={handleAccommodationSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Destination */}
                    <div className="space-y-2">
                      <Label htmlFor="destination" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#01502E]" />
                        Destination
                      </Label>
                      <Input
                        id="destination"
                        placeholder="Where are you going?"
                        value={accommodationForm.destination}
                        onChange={(e) => setAccommodationForm(prev => ({ ...prev, destination: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Check-in */}
                    <div className="space-y-2">
                      <Label htmlFor="checkIn" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#01502E]" />
                        Check-in
                      </Label>
                      <Input
                        id="checkIn"
                        type="date"
                        value={accommodationForm.checkIn}
                        onChange={(e) => setAccommodationForm(prev => ({ ...prev, checkIn: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Check-out */}
                    <div className="space-y-2">
                      <Label htmlFor="checkOut" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#01502E]" />
                        Check-out
                      </Label>
                      <Input
                        id="checkOut"
                        type="date"
                        value={accommodationForm.checkOut}
                        onChange={(e) => setAccommodationForm(prev => ({ ...prev, checkOut: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Guests & Rooms */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#01502E]" />
                        Guests & Rooms
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={accommodationForm.adults.toString()}
                          onValueChange={(value) => setAccommodationForm(prev => ({ ...prev, adults: parseInt(value) }))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Adults" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} Adult{num > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={accommodationForm.children.toString()}
                          onValueChange={(value) => setAccommodationForm(prev => ({ ...prev, children: parseInt(value) }))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Children" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 6 }, (_, i) => i).map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} Child{num !== 1 ? 'ren' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#01502E] hover:bg-[#013d23] text-lg font-semibold"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Search Stays
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Vehicles Tab */}
              <TabsContent value="vehicles">
                <form onSubmit={handleVehicleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Pickup Location */}
                    <div className="space-y-2">
                      <Label htmlFor="pickupLocation" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#01502E]" />
                        Pickup Location
                      </Label>
                      <Input
                        id="pickupLocation"
                        placeholder="Where to pick up?"
                        value={vehicleForm.pickupLocation}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Pickup Date */}
                    <div className="space-y-2">
                      <Label htmlFor="pickupDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#01502E]" />
                        Pickup Date
                      </Label>
                      <Input
                        id="pickupDate"
                        type="date"
                        value={vehicleForm.pickupDate}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, pickupDate: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Return Date */}
                    <div className="space-y-2">
                      <Label htmlFor="returnDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#01502E]" />
                        Return Date
                      </Label>
                      <Input
                        id="returnDate"
                        type="date"
                        value={vehicleForm.returnDate}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, returnDate: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Pickup Time */}
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#01502E]" />
                        Pickup Time
                      </Label>
                      <Input
                        id="pickupTime"
                        type="time"
                        value={vehicleForm.pickupTime}
                        onChange={(e) => setVehicleForm(prev => ({ ...prev, pickupTime: e.target.value }))}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#01502E] hover:bg-[#013d23] text-lg font-semibold"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Search Cars
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Tours Tab */}
              <TabsContent value="tours">
                <form onSubmit={handleTourSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Destination */}
                    <div className="space-y-2">
                      <Label htmlFor="tourDestination" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#01502E]" />
                        Destination
                      </Label>
                      <Input
                        id="tourDestination"
                        placeholder="Where to explore?"
                        value={tourForm.destination}
                        onChange={(e) => setTourForm(prev => ({ ...prev, destination: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Tour Date */}
                    <div className="space-y-2">
                      <Label htmlFor="tourDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#01502E]" />
                        Tour Date
                      </Label>
                      <Input
                        id="tourDate"
                        type="date"
                        value={tourForm.tourDate}
                        onChange={(e) => setTourForm(prev => ({ ...prev, tourDate: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#01502E]" />
                        Guests
                      </Label>
                      <Select
                        value={tourForm.guests.toString()}
                        onValueChange={(value) => setTourForm(prev => ({ ...prev, guests: parseInt(value) }))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Number of guests" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Guest{num > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tour Type */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#01502E]" />
                        Tour Type
                      </Label>
                      <Select
                        value={tourForm.tourType}
                        onValueChange={(value) => setTourForm(prev => ({ ...prev, tourType: value }))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select tour type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city">City Tour</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="nature">Nature</SelectItem>
                          <SelectItem value="historical">Historical</SelectItem>
                          <SelectItem value="food">Food Tour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#01502E] hover:bg-[#013d23] text-lg font-semibold"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Search Tours
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities">
                <form onSubmit={handleActivitySearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="activityLocation" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#01502E]" />
                        Location
                      </Label>
                      <Input
                        id="activityLocation"
                        placeholder="Where to have fun?"
                        value={activityForm.location}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Activity Date */}
                    <div className="space-y-2">
                      <Label htmlFor="activityDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#01502E]" />
                        Activity Date
                      </Label>
                      <Input
                        id="activityDate"
                        type="date"
                        value={activityForm.activityDate}
                        onChange={(e) => setActivityForm(prev => ({ ...prev, activityDate: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    {/* Guests */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#01502E]" />
                        Participants
                      </Label>
                      <Select
                        value={activityForm.guests.toString()}
                        onValueChange={(value) => setActivityForm(prev => ({ ...prev, guests: parseInt(value) }))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Number of participants" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} Participant{num > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Activity Type */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#01502E]" />
                        Activity Type
                      </Label>
                      <Select
                        value={activityForm.activityType}
                        onValueChange={(value) => setActivityForm(prev => ({ ...prev, activityType: value }))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select activity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outdoor">Outdoor Adventure</SelectItem>
                          <SelectItem value="cultural">Cultural Experience</SelectItem>
                          <SelectItem value="sports">Sports & Recreation</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="wellness">Wellness & Spa</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-[#01502E] hover:bg-[#013d23] text-lg font-semibold"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Search Activities
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {actionData?.errors && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-red-600">
                <h3 className="font-semibold mb-2">Please fix the following errors:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {Object.values(actionData.errors).map((error: any, idx: number) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
