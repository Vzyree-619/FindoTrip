import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { 
  Hotel, 
  Car, 
  MapPin, 
  Star, 
  Users, 
  Edit, 
  Plus,
  Trash2,
  Eye,
  TrendingUp
} from "lucide-react";

export async function loader({ request }) {
  const user = await getUser(request);
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [properties, vehicles, tours, stats] = await Promise.all([
    prisma.property.findMany({
      include: {
        owner: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.vehicle.findMany({
      include: {
        owner: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.tour.findMany({
      include: {
        guide: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.$transaction([
      prisma.property.count(),
      prisma.vehicle.count(),
      prisma.tour.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } })
    ])
  ]);

  const [totalProperties, totalVehicles, totalTours, totalCustomers] = stats;

  return json({
    user,
    properties,
    vehicles,
    tours,
    stats: {
      totalProperties,
      totalVehicles,
      totalTours,
      totalCustomers
    }
  });
}

export default function ContentManagerDashboard() {
  const { user, properties, vehicles, tours, stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleToggleStatus = (type: 'property' | 'vehicle' | 'tour', id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
    fetcher.submit(
      { type, id, status: newStatus },
      { method: 'post', action: '/api/content/toggle-status' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Management Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage properties, vehicles, and tours across the platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Hotel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-xs text-muted-foreground">
                Hotels, resorts, and accommodations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">
                Cars, SUVs, and vans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTours}</div>
              <p className="text-xs text-muted-foreground">
                Guided tours and experiences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Tabs */}
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Properties ({properties.length})</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
            <TabsTrigger value="tours">Tours ({tours.length})</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Properties Management</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    {property.images?.[0] && (
                      <img 
                        src={property.images[0]} 
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Badge 
                      className={`absolute top-2 right-2 ${
                        property.approvalStatus === 'APPROVED' 
                          ? 'bg-green-500' 
                          : property.approvalStatus === 'PENDING'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {property.approvalStatus}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {property.city}, {property.country}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{property.rating || 0}</span>
                        <span className="text-sm text-gray-500">({property.reviewCount || 0})</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        PKR {property.basePrice?.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Owner: {property.owner?.user?.name || 'Unknown'}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleStatus('property', property.id, property.approvalStatus)}
                        >
                          {property.approvalStatus === 'APPROVED' ? 'Disapprove' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Vehicles Management</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    {vehicle.images?.[0] && (
                      <img 
                        src={vehicle.images[0]} 
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Badge 
                      className={`absolute top-2 right-2 ${
                        vehicle.approvalStatus === 'APPROVED' 
                          ? 'bg-green-500' 
                          : vehicle.approvalStatus === 'PENDING'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {vehicle.approvalStatus}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {vehicle.city}, {vehicle.country}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{vehicle.rating || 0}</span>
                        <span className="text-sm text-gray-500">({vehicle.reviewCount || 0})</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        PKR {vehicle.basePrice?.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>{vehicle.brand} {vehicle.model} ({vehicle.year})</div>
                      <div>{vehicle.seats} seats • {vehicle.transmission} • {vehicle.fuelType}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Owner: {vehicle.owner?.user?.name || 'Unknown'}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleStatus('vehicle', vehicle.id, vehicle.approvalStatus)}
                        >
                          {vehicle.approvalStatus === 'APPROVED' ? 'Disapprove' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tours Tab */}
          <TabsContent value="tours" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tours Management</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tour
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <Card key={tour.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-200 relative">
                    {tour.images?.[0] && (
                      <img 
                        src={tour.images[0]} 
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Badge 
                      className={`absolute top-2 right-2 ${
                        tour.approvalStatus === 'APPROVED' 
                          ? 'bg-green-500' 
                          : tour.approvalStatus === 'PENDING'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {tour.approvalStatus}
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg">{tour.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {tour.city}, {tour.country}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{tour.rating || 0}</span>
                        <span className="text-sm text-gray-500">({tour.reviewCount || 0})</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        PKR {tour.pricePerPerson?.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>{tour.duration} hours • Max {tour.maxGroupSize} people</div>
                      <div>Difficulty: {tour.difficulty}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Guide: {tour.guide?.user?.name || 'Unknown'}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleStatus('tour', tour.id, tour.approvalStatus)}
                        >
                          {tour.approvalStatus === 'APPROVED' ? 'Disapprove' : 'Approve'}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
