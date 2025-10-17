import { Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Building2, 
  Car, 
  MapPin, 
  Users, 
  DollarSign, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Shield,
  Clock,
  TrendingUp,
  Heart,
  Play,
  Pause
} from "lucide-react";

export default function Register() {
  const [activeTab, setActiveTab] = useState("property");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const tabOrder = ["property", "vehicle", "tour"];
  const autoPlayInterval = 4000; // 4 seconds

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveTab(currentTab => {
        const currentIndex = tabOrder.indexOf(currentTab);
        const nextIndex = (currentIndex + 1) % tabOrder.length;
        return tabOrder[nextIndex];
      });
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Pause auto-play when user manually selects a tab
  const handleTabChange = (value) => {
    setActiveTab(value);
    setIsAutoPlaying(false);
  };

  // Resume auto-play after 10 seconds of inactivity
  useEffect(() => {
    if (!isAutoPlaying) {
      const timeout = setTimeout(() => {
        setIsAutoPlaying(true);
      }, 10000); // Resume after 10 seconds

      return () => clearTimeout(timeout);
    }
  }, [isAutoPlaying]);

  const registrationTypes = {
    property: {
      title: "Property Owner",
      subtitle: "Hotels & Stays",
      icon: Building2,
      color: "bg-blue-500",
      description: "List your properties and earn from bookings",
      benefits: [
        "Low commission rates",
        "24/7 customer support", 
        "Easy property management",
        "Secure payments",
        "Marketing support",
        "Analytics dashboard"
      ],
      features: [
        { icon: Users, title: "Reach More Guests", desc: "Connect with thousands of travelers" },
        { icon: DollarSign, title: "Earn More, Pay Less", desc: "Keep more of your earnings" },
        { icon: Star, title: "Build Reputation", desc: "Get reviews from satisfied guests" }
      ],
      route: "/register/property-owner"
    },
    vehicle: {
      title: "Vehicle Owner",
      subtitle: "Car Rental",
      icon: Car,
      color: "bg-green-500",
      description: "Rent out your vehicles and maximize earnings",
      benefits: [
        "Flexible rental terms",
        "Insurance coverage",
        "Driver matching service",
        "Real-time tracking",
        "Maintenance support",
        "Customer reviews"
      ],
      features: [
        { icon: Car, title: "Flexible Rentals", desc: "Set your own terms and availability" },
        { icon: Shield, title: "Secure & Insured", desc: "Full protection for your vehicle" },
        { icon: TrendingUp, title: "Maximize Earnings", desc: "Optimize your rental income" }
      ],
      route: "/register/vehicle-owner"
    },
    tour: {
      title: "Tour Guide",
      subtitle: "Tours & Experiences",
      icon: MapPin,
      color: "bg-purple-500",
      description: "Share your local knowledge and create memorable experiences",
      benefits: [
        "Create custom tours",
        "Local expertise showcase",
        "Flexible scheduling",
        "Group size control",
        "Cultural exchange",
        "Adventure planning"
      ],
      features: [
        { icon: MapPin, title: "Share Local Knowledge", desc: "Showcase hidden gems and culture" },
        { icon: Heart, title: "Create Memories", desc: "Help travelers discover amazing places" },
        { icon: Clock, title: "Flexible Schedule", desc: "Work on your own terms" }
      ],
      route: "/register/tour-guide"
    }
  };

  const currentType = registrationTypes[activeTab];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-[#01502E]/10 text-[#01502E] px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Users className="h-4 w-4" />
          <span>Service Providers</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Join Our Platform
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose your service type and start earning with our community
        </p>
      </div>

      {/* Registration Types Tabs */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Choose Your Service Type</h3>
            {isAutoPlaying && (
              <div className="flex items-center gap-1 text-sm text-[#01502E]">
                <div className="w-2 h-2 bg-[#01502E] rounded-full animate-pulse"></div>
                <span>Auto-playing</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="flex items-center gap-2"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Auto Play</span>
              </>
            )}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="property" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Vehicles</span>
            </TabsTrigger>
            <TabsTrigger value="tour" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Tours</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Content */}
              <div className="space-y-8">
                {/* Service Type Header */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                    <div className={`p-3 rounded-full ${currentType.color} text-white`}>
                      <currentType.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{currentType.title}</h3>
                      <p className="text-gray-600">{currentType.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600">{currentType.description}</p>
                </div>

                {/* Key Features */}
                <div className="space-y-4">
                  {currentType.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="bg-[#01502E]/10 p-3 rounded-full">
                        <feature.icon className="h-5 w-5 text-[#01502E]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                        <p className="text-gray-600 text-sm">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Benefits List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What You Get:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentType.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#01502E] flex-shrink-0" />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Button */}
                <div className="text-center lg:text-left">
                  <Link to={currentType.route}>
                    <Button size="lg" className="w-full sm:w-auto bg-[#01502E] hover:bg-[#013d23] text-white px-8 py-4">
                      <span>Register as {currentType.title}</span>
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side - Visual Content */}
              <div className="space-y-6">
                {/* Platform Benefits */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-[#01502E] mb-2">Easy</div>
                      <div className="text-sm text-gray-600">Registration Process</div>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-[#01502E] mb-2">24/7</div>
                      <div className="text-sm text-gray-600">Support Available</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Why Choose Us */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Why Choose Us?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-[#01502E]/10 text-[#01502E]">
                        Low Commission
                      </Badge>
                      <span className="text-sm text-gray-600">Keep more of your earnings</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-[#01502E]/10 text-[#01502E]">
                        24/7 Support
                      </Badge>
                      <span className="text-sm text-gray-600">Always here to help</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-[#01502E]/10 text-[#01502E]">
                        Secure Payments
                      </Badge>
                      <span className="text-sm text-gray-600">Safe and reliable transactions</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
  