import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Building, 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  Shield,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3
} from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const propertyId = params.id;
  
  if (!propertyId) {
    throw new Response("Property ID required", { status: 400 });
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        city: true,
        country: true,
        address: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
        basePrice: true,
        cleaningFee: true,
        currency: true,
        images: true,
        amenities: true,
        houseRules: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            businessPhone: true,
            businessCity: true,
            verificationLevel: true,
            totalProperties: true,
            totalRevenue: true,
            averageRating: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                verified: true,
                active: true
              }
            }
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      }
    });

    if (!property) {
      throw new Response("Property not found", { status: 404 });
    }

    // Get property analytics
    const [
      totalRevenue,
      recentBookings,
      averageRating,
      occupancyRate
    ] = await Promise.all([
      prisma.propertyBooking.aggregate({
        where: { propertyId: property.id },
        _sum: { totalPrice: true }
      }),
      prisma.propertyBooking.findMany({
        where: { propertyId: property.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.review.aggregate({
        where: { 
          serviceId: property.id,
          serviceType: 'property'
        },
        _avg: { rating: true }
      }),
      // Calculate occupancy rate (simplified)
      prisma.propertyBooking.count({
        where: { 
          propertyId: property.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
      })
    ]);

    return json({
      admin,
      property,
      analytics: {
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        recentBookings,
        averageRating: averageRating._avg.rating || 0,
        occupancyRate: occupancyRate
      }
    });
  } catch (error) {
    console.error("Error fetching property:", error);
    throw new Response("Failed to load property", { status: 500 });
  }
}

export default function AdminPropertyView() {
  const { admin, property, analytics } = useLoaderData<typeof loader>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (level: string) => {
    switch (level) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'BASIC': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/admin/services/properties">
                <Button variant="outline" className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Properties</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
                <p className="text-gray-600">{property.city}, {property.country}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(property.approvalStatus)}>
                {property.approvalStatus}
              </Badge>
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <span>Edit Property</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images */}
            <Card>
              <CardHeader>
                <CardTitle>Property Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.images && property.images.length > 0 ? (
                    property.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <Building className="w-8 h-8 text-gray-400" />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building className="w-12 h-12 text-gray-400" />
                      <span className="ml-2 text-gray-500">No images available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900">{property.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Max Guests</label>
                    <p className="text-gray-900">{property.maxGuests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bedrooms</label>
                    <p className="text-gray-900">{property.bedrooms}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bathrooms</label>
                    <p className="text-gray-900">{property.bathrooms}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Base Price</label>
                    <p className="text-gray-900">{property.currency} {property.basePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cleaning Fee</label>
                    <p className="text-gray-900">{property.currency} {property.cleaningFee.toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900 mt-1">{property.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900 mt-1">{property.address}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Amenities</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary">{amenity}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">No amenities listed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentBookings && analytics.recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{booking.user.name}</p>
                          <p className="text-sm text-gray-600">{booking.user.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{booking.currency} {booking.totalPrice.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{new Date(booking.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent bookings</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Business Name</label>
                  <p className="text-gray-900">{property.owner.businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Person</label>
                  <p className="text-gray-900">{property.owner.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{property.owner.businessEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{property.owner.businessPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-gray-900">{property.owner.businessCity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Verification Level</label>
                  <Badge className={getVerificationColor(property.owner.verificationLevel)}>
                    {property.owner.verificationLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Property Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="font-medium">{property.currency} {(analytics.totalRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="font-medium">{property._count.bookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Reviews</span>
                  <span className="font-medium">{property._count.reviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{(analytics.averageRating || 0).toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Occupancy Rate</span>
                  <span className="font-medium">{analytics.occupancyRate || 0}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Bookings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Property
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  {property.approvalStatus === 'APPROVED' ? 'Suspend' : 'Approve'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
