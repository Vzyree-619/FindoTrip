import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  User, 
  Building, 
  Car, 
  MapPin, 
  Shield,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Star,
  DollarSign,
  AlertTriangle,
  UserCheck,
  UserX,
  Settings,
  Activity,
  MessageSquare,
  Download,
  ArrowLeft,
  TrendingUp,
  Award,
  Flag,
  Ban
} from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const userId = params.userId;
  
  if (!userId) {
    throw new Response("User ID is required", { status: 400 });
  }
  
  // Get user with all related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      propertyBookings: {
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      vehicleBookings: {
        include: {
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              category: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      tourBookings: {
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              city: true,
              difficulty: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      reviews: {
        include: {
          property: {
            select: {
              id: true,
              name: true
            }
          },
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true
            }
          },
          tour: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      properties: {
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          basePrice: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      vehicles: {
        select: {
          id: true,
          brand: true,
          model: true,
          category: true,
          city: true,
          basePrice: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      tours: {
        select: {
          id: true,
          title: true,
          city: true,
          difficulty: true,
          pricePerPerson: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          propertyBookings: true,
          vehicleBookings: true,
          tourBookings: true,
          reviews: true,
          properties: true,
          vehicles: true,
          tours: true
        }
      }
    }
  });
  
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  
  // Calculate totals
  const totalBookings = user._count.propertyBookings + user._count.vehicleBookings + user._count.tourBookings;
  const totalSpent = user.propertyBookings.reduce((sum, booking) => sum + booking.totalPrice, 0) +
                    user.vehicleBookings.reduce((sum, booking) => sum + booking.totalPrice, 0) +
                    user.tourBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  
  const totalEarned = user.properties.reduce((sum, property) => sum + (property.basePrice || 0), 0) +
                     user.vehicles.reduce((sum, vehicle) => sum + (vehicle.basePrice || 0), 0) +
                     user.tours.reduce((sum, tour) => sum + (tour.pricePerPerson || 0), 0);
  
  // Get recent activity
  const recentActivity = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId: userId },
        { targetUserId: userId }
      ]
    },
    orderBy: { timestamp: 'desc' },
    take: 20,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  
  return json({
    admin,
    user,
    totalBookings,
    totalSpent,
    totalEarned,
    recentActivity
  });
}

export default function UserDetails() {
  const { admin, user, totalBookings, totalSpent, totalEarned, recentActivity } = useLoaderData<typeof loader>();
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return Users;
      case 'PROPERTY_OWNER': return Building;
      case 'VEHICLE_OWNER': return Car;
      case 'TOUR_GUIDE': return MapPin;
      default: return User;
    }
  };
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800';
      case 'PROPERTY_OWNER': return 'bg-green-100 text-green-800';
      case 'VEHICLE_OWNER': return 'bg-purple-100 text-purple-800';
      case 'TOUR_GUIDE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const RoleIcon = getRoleIcon(user.role);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link to="/admin/users/all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600">Complete user profile and activity</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit User
          </Button>
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Message
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Profile
          </Button>
        </div>
      </div>
      
      {/* User Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RoleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-lg font-bold text-gray-900">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg font-bold text-gray-900">
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-lg font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                {user.role === 'CUSTOMER' ? 'Total Spent' : 'Total Earned'}
              </p>
              <p className="text-lg font-bold text-gray-900">
                PKR {(user.role === 'CUSTOMER' ? totalSpent : totalEarned).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <RoleIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{user.name}</h4>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Last login {new Date(user.lastLoginAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
              {user.verified && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
              {user.isActive ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </Card>
        
        {/* Activity Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
                <div className="text-sm text-gray-600">Total Bookings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.reviews}</div>
                <div className="text-sm text-gray-600">Reviews Given</div>
              </div>
            </div>
            
            {user.role !== 'CUSTOMER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {user._count.properties + user._count.vehicles + user._count.tours}
                  </div>
                  <div className="text-sm text-gray-600">Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    PKR {totalEarned.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Earned</div>
                </div>
              </div>
            )}
            
            {user.role === 'CUSTOMER' && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  PKR {totalSpent.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
            )}
          </div>
        </Card>
        
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
            {!user.verified && (
              <Button variant="outline" className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify Account
              </Button>
            )}
            {user.isActive ? (
              <Button variant="outline" className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50">
                <Ban className="w-4 h-4 mr-2" />
                Suspend Account
              </Button>
            ) : (
              <Button variant="outline" className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50">
                <UserCheck className="w-4 h-4 mr-2" />
                Activate Account
              </Button>
            )}
          </div>
        </Card>
      </div>
      
      {/* Detailed Information Tabs */}
      <div className="space-y-6">
        {/* Bookings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
          {totalBookings === 0 ? (
            <p className="text-gray-600">No bookings found</p>
          ) : (
            <div className="space-y-4">
              {user.propertyBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.property.name}</p>
                      <p className="text-sm text-gray-600">{booking.property.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">PKR {booking.totalPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {user.vehicleBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Car className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.vehicle.brand} {booking.vehicle.model}</p>
                      <p className="text-sm text-gray-600">{booking.vehicle.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">PKR {booking.totalPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {user.tourBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{booking.tour.title}</p>
                      <p className="text-sm text-gray-600">{booking.tour.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">PKR {booking.totalPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        {/* Reviews */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          {user._count.reviews === 0 ? (
            <p className="text-gray-600">No reviews found</p>
          ) : (
            <div className="space-y-4">
              {user.reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{review.content}</p>
                  <p className="text-sm text-gray-600">
                    Review for: {review.property?.name || review.vehicle?.brand + ' ' + review.vehicle?.model || review.tour?.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-gray-600">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
