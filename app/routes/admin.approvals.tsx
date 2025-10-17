import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  Building, 
  Car, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  UserCheck,
  Building2,
  Calendar,
  Star,
  Phone,
  Mail,
  MapPin as LocationIcon
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'providers';
  
  // Get pending provider applications
  const pendingProviders = await prisma.user.findMany({
    where: {
      role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
      verified: false
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Get pending service listings
  const pendingProperties = await prisma.property.findMany({
    where: { approvalStatus: 'PENDING' },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      city: true,
      description: true,
      basePrice: true,
      createdAt: true,
      ownerId: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const pendingVehicles = await prisma.vehicle.findMany({
    where: { approvalStatus: 'PENDING' },
    select: {
      id: true,
      brand: true,
      model: true,
      category: true,
      city: true,
      description: true,
      basePrice: true,
      createdAt: true,
      ownerId: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const pendingTours = await prisma.tour.findMany({
    where: { approvalStatus: 'PENDING' },
    select: {
      id: true,
      title: true,
      city: true,
      difficulty: true,
      description: true,
      pricePerPerson: true,
      createdAt: true,
      guideId: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return json({
    admin,
    tab,
    pendingProviders,
    pendingProperties,
    pendingVehicles,
    pendingTours
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const type = formData.get('type') as string;
  const id = formData.get('id') as string;
  const reason = formData.get('reason') as string;
  
  try {
    if (action === 'approve') {
      if (type === 'provider') {
        await prisma.user.update({
          where: { id },
          data: { verified: true }
        });
        await logAdminAction(admin.id, 'PROVIDER_APPROVED', `Approved provider: ${id}`, request);
      } else if (type === 'property') {
        await prisma.property.update({
          where: { id },
          data: { approvalStatus: 'APPROVED' }
        });
        await logAdminAction(admin.id, 'PROPERTY_APPROVED', `Approved property: ${id}`, request);
      } else if (type === 'vehicle') {
        await prisma.vehicle.update({
          where: { id },
          data: { approvalStatus: 'APPROVED' }
        });
        await logAdminAction(admin.id, 'VEHICLE_APPROVED', `Approved vehicle: ${id}`, request);
      } else if (type === 'tour') {
        await prisma.tour.update({
          where: { id },
          data: { approvalStatus: 'APPROVED' }
        });
        await logAdminAction(admin.id, 'TOUR_APPROVED', `Approved tour: ${id}`, request);
      }
    } else if (action === 'reject') {
      if (type === 'provider') {
        await prisma.user.update({
          where: { id },
          data: { verified: false }
        });
        await logAdminAction(admin.id, 'PROVIDER_REJECTED', `Rejected provider: ${id}. Reason: ${reason}`, request);
      } else if (type === 'property') {
        await prisma.property.update({
          where: { id },
          data: { approvalStatus: 'REJECTED' }
        });
        await logAdminAction(admin.id, 'PROPERTY_REJECTED', `Rejected property: ${id}. Reason: ${reason}`, request);
      } else if (type === 'vehicle') {
        await prisma.vehicle.update({
          where: { id },
          data: { approvalStatus: 'REJECTED' }
        });
        await logAdminAction(admin.id, 'VEHICLE_REJECTED', `Rejected vehicle: ${id}. Reason: ${reason}`, request);
      } else if (type === 'tour') {
        await prisma.tour.update({
          where: { id },
          data: { approvalStatus: 'REJECTED' }
        });
        await logAdminAction(admin.id, 'TOUR_REJECTED', `Rejected tour: ${id}. Reason: ${reason}`, request);
      }
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Approval action error:', error);
    return json({ success: false, error: 'Failed to process approval' }, { status: 500 });
  }
}

export default function AdminApprovals() {
  const { admin, tab, pendingProviders, pendingProperties, pendingVehicles, pendingTours } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState('');
  const [rejectType, setRejectType] = useState('');
  
  const fetcher = useFetcher();
  
  const handleApprove = (id: string, type: string) => {
    const formData = new FormData();
    formData.append('action', 'approve');
    formData.append('type', type);
    formData.append('id', id);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleReject = (id: string, type: string) => {
    setRejectId(id);
    setRejectType(type);
    setRejectReason('');
  };
  
  const submitReject = () => {
    if (!rejectReason.trim()) return;
    
    const formData = new FormData();
    formData.append('action', 'reject');
    formData.append('type', rejectType);
    formData.append('id', rejectId);
    formData.append('reason', rejectReason);
    fetcher.submit(formData, { method: 'post' });
    
    setRejectId('');
    setRejectType('');
    setRejectReason('');
  };
  
  const tabs = [
    { id: 'providers', label: 'Provider Applications', count: pendingProviders.length, icon: Users },
    { id: 'properties', label: 'Property Listings', count: pendingProperties.length, icon: Building },
    { id: 'vehicles', label: 'Vehicle Listings', count: pendingVehicles.length, icon: Car },
    { id: 'tours', label: 'Tour Listings', count: pendingTours.length, icon: MapPin }
  ];
  
  const currentTab = searchParams.get('tab') || 'providers';
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PROPERTY_OWNER': return 'bg-blue-100 text-blue-800';
      case 'VEHICLE_OWNER': return 'bg-green-100 text-green-800';
      case 'TOUR_GUIDE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PROPERTY_OWNER': return Building;
      case 'VEHICLE_OWNER': return Car;
      case 'TOUR_GUIDE': return MapPin;
      default: return UserCheck;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-600">Review and approve provider applications and service listings</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Pending: {pendingProviders.length + pendingProperties.length + pendingVehicles.length + pendingTours.length}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {currentTab === 'providers' && (
          <div className="space-y-4">
            {pendingProviders.length === 0 ? (
              <Card className="p-8 text-center">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Providers</h3>
                <p className="text-gray-600">All provider applications have been reviewed.</p>
              </Card>
            ) : (
              pendingProviders.map((provider) => {
                const RoleIcon = getRoleIcon(provider.role);
                
                return (
                  <Card key={provider.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <RoleIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(provider.role)}`}>
                              {provider.role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{provider.email}</span>
                            </div>
                            {provider.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>{provider.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>Applied {new Date(provider.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(provider.id, 'provider')}
                          disabled={fetcher.state === 'submitting'}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(provider.id, 'provider')}
                          disabled={fetcher.state === 'submitting'}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
        
        {currentTab === 'properties' && (
          <div className="space-y-4">
            {pendingProperties.length === 0 ? (
              <Card className="p-8 text-center">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Properties</h3>
                <p className="text-gray-600">All property listings have been reviewed.</p>
              </Card>
            ) : (
              pendingProperties.map((property) => (
                <Card key={property.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {property.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <LocationIcon className="w-4 h-4" />
                            <span>{property.address}, {property.city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>PKR {property.basePrice.toLocaleString()}/night</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Listed {new Date(property.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 line-clamp-2">{property.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(property.id, 'property')}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(property.id, 'property')}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        
        {currentTab === 'vehicles' && (
          <div className="space-y-4">
            {pendingVehicles.length === 0 ? (
              <Card className="p-8 text-center">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Vehicles</h3>
                <p className="text-gray-600">All vehicle listings have been reviewed.</p>
              </Card>
            ) : (
              pendingVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Car className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {vehicle.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <LocationIcon className="w-4 h-4" />
                            <span>{vehicle.city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>PKR {vehicle.basePrice.toLocaleString()}/day</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Listed {new Date(vehicle.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 line-clamp-2">{vehicle.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(vehicle.id, 'vehicle')}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(vehicle.id, 'vehicle')}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        
        {currentTab === 'tours' && (
          <div className="space-y-4">
            {pendingTours.length === 0 ? (
              <Card className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Tours</h3>
                <p className="text-gray-600">All tour listings have been reviewed.</p>
              </Card>
            ) : (
              pendingTours.map((tour) => (
                <Card key={tour.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{tour.title}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {tour.difficulty}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <LocationIcon className="w-4 h-4" />
                            <span>{tour.city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>PKR {tour.pricePerPerson.toLocaleString()}/person</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Listed {new Date(tour.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 line-clamp-2">{tour.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(tour.id, 'tour')}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(tour.id, 'tour')}
                        disabled={fetcher.state === 'submitting'}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject {rejectType}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectId('');
                    setRejectType('');
                    setRejectReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReject}
                  disabled={!rejectReason.trim() || fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
