import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Building, 
  Car, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  Star,
  Phone,
  Mail,
  MapPin as LocationIcon,
  FileText,
  Download,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  User,
  DollarSign,
  Calendar,
  Users,
  Settings,
  Image,
  Video,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const serviceType = url.searchParams.get('serviceType') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const status = url.searchParams.get('status') || 'pending';
  
  // Build where clause for services
  const whereClause: any = {
    approvalStatus: status.toUpperCase()
  };
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Get pending services across all types
  const [pendingProperties, pendingVehicles, pendingTours] = await Promise.all([
    // Properties
    serviceType === 'all' || serviceType === 'properties' ? 
    prisma.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verified: true,
            propertyOwner: {
              select: {
                businessName: true,
                businessPhone: true,
                businessEmail: true
              }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' }
    }) : [],
    
    // Vehicles
    serviceType === 'all' || serviceType === 'vehicles' ? 
    prisma.vehicle.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verified: true,
            vehicleOwner: {
              select: {
                businessName: true,
                businessPhone: true,
                businessEmail: true
              }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' }
    }) : [],
    
    // Tours
    serviceType === 'all' || serviceType === 'tours' ? 
    prisma.tour.findMany({
      where: whereClause,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            verified: true,
            tourGuide: {
              select: {
                firstName: true,
                lastName: true,
                businessPhone: true,
                businessEmail: true
              }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' }
    }) : []
  ]);
  
  // Get counts by service type
  const serviceCounts = await Promise.all([
    prisma.property.count({ where: { approvalStatus: status.toUpperCase() } }),
    prisma.vehicle.count({ where: { approvalStatus: status.toUpperCase() } }),
    prisma.tour.count({ where: { approvalStatus: status.toUpperCase() } })
  ]);
  
  // Get status counts
  const statusCounts = await Promise.all([
    prisma.property.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.tour.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.property.count({ where: { approvalStatus: 'REQUIRES_CHANGES' } }),
    prisma.vehicle.count({ where: { approvalStatus: 'REQUIRES_CHANGES' } }),
    prisma.tour.count({ where: { approvalStatus: 'REQUIRES_CHANGES' } }),
    prisma.property.count({ where: { approvalStatus: 'UNDER_REVIEW' } }),
    prisma.vehicle.count({ where: { approvalStatus: 'UNDER_REVIEW' } }),
    prisma.tour.count({ where: { approvalStatus: 'UNDER_REVIEW' } })
  ]);
  
  return json({
    admin,
    pendingProperties,
    pendingVehicles,
    pendingTours,
    serviceCounts: {
      properties: serviceCounts[0],
      vehicles: serviceCounts[1],
      tours: serviceCounts[2]
    },
    statusCounts: {
      pending: statusCounts[0] + statusCounts[1] + statusCounts[2],
      requiresChanges: statusCounts[3] + statusCounts[4] + statusCounts[5],
      underReview: statusCounts[6] + statusCounts[7] + statusCounts[8]
    },
    filters: { search, serviceType, sort, status }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const serviceId = formData.get('serviceId') as string;
  const serviceType = formData.get('serviceType') as string;
  const reason = formData.get('reason') as string;
  const notes = formData.get('notes') as string;
  
  try {
    if (action === 'approve') {
      // Update service approval status
      if (serviceType === 'property') {
        await prisma.property.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'APPROVED',
            approvedBy: admin.id,
            approvedAt: new Date()
          }
        });
      } else if (serviceType === 'vehicle') {
        await prisma.vehicle.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'APPROVED',
            approvedBy: admin.id,
            approvedAt: new Date()
          }
        });
      } else if (serviceType === 'tour') {
        await prisma.tour.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'APPROVED',
            approvedBy: admin.id,
            approvedAt: new Date()
          }
        });
      }
      
      await logAdminAction(admin.id, 'SERVICE_APPROVED', `Approved ${serviceType}: ${serviceId}`, request);
      
    } else if (action === 'reject') {
      // Update service approval status
      if (serviceType === 'property') {
        await prisma.property.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'REJECTED',
            rejectionReason: reason,
            approvedBy: admin.id,
            approvedAt: new Date()
          }
        });
      } else if (serviceType === 'vehicle') {
        await prisma.vehicle.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'REJECTED',
            rejectionReason: reason,
            approvedBy: admin.id,
            approvedAt: new Date()
          }
        });
      } else if (serviceType === 'tour') {
        await prisma.tour.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'REJECTED',
            rejectionReason: reason,
            approvedBy: admin.id,
            approvedAt: new Date()
          }
        });
      }
      
      await logAdminAction(admin.id, 'SERVICE_REJECTED', `Rejected ${serviceType}: ${serviceId}. Reason: ${reason}`, request);
      
    } else if (action === 'request_changes') {
      // Update service approval status
      if (serviceType === 'property') {
        await prisma.property.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'REQUIRES_CHANGES',
            rejectionReason: reason
          }
        });
      } else if (serviceType === 'vehicle') {
        await prisma.vehicle.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'REQUIRES_CHANGES',
            rejectionReason: reason
          }
        });
      } else if (serviceType === 'tour') {
        await prisma.tour.update({
          where: { id: serviceId },
          data: { 
            approvalStatus: 'REQUIRES_CHANGES',
            rejectionReason: reason
          }
        });
      }
      
      await logAdminAction(admin.id, 'SERVICE_CHANGES_REQUESTED', `Requested changes for ${serviceType}: ${serviceId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Service approval action error:', error);
    return json({ success: false, error: 'Failed to process approval' }, { status: 500 });
  }
}

export default function PendingServiceApprovals() {
  const { admin, pendingProperties, pendingVehicles, pendingTours, serviceCounts, statusCounts, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; serviceId: string; serviceName: string; serviceType: string }>({
    open: false,
    serviceId: '',
    serviceName: '',
    serviceType: ''
  });
  const [changesModal, setChangesModal] = useState<{ open: boolean; serviceId: string; serviceName: string; serviceType: string }>({
    open: false,
    serviceId: '',
    serviceName: '',
    serviceType: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [changesReason, setChangesReason] = useState('');
  
  const fetcher = useFetcher();
  
  const handleApprove = (serviceId: string, serviceType: string) => {
    const formData = new FormData();
    formData.append('action', 'approve');
    formData.append('serviceId', serviceId);
    formData.append('serviceType', serviceType);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleReject = (serviceId: string, serviceName: string, serviceType: string) => {
    setRejectModal({ open: true, serviceId, serviceName, serviceType });
    setRejectReason('');
  };
  
  const handleRequestChanges = (serviceId: string, serviceName: string, serviceType: string) => {
    setChangesModal({ open: true, serviceId, serviceName, serviceType });
    setChangesReason('');
  };
  
  const submitReject = () => {
    if (!rejectReason.trim()) return;
    
    const formData = new FormData();
    formData.append('action', 'reject');
    formData.append('serviceId', rejectModal.serviceId);
    formData.append('serviceType', rejectModal.serviceType);
    formData.append('reason', rejectReason);
    fetcher.submit(formData, { method: 'post' });
    
    setRejectModal({ open: false, serviceId: '', serviceName: '', serviceType: '' });
    setRejectReason('');
  };
  
  const submitChangesRequest = () => {
    if (!changesReason.trim()) return;
    
    const formData = new FormData();
    formData.append('action', 'request_changes');
    formData.append('serviceId', changesModal.serviceId);
    formData.append('serviceType', changesModal.serviceType);
    formData.append('reason', changesReason);
    fetcher.submit(formData, { method: 'post' });
    
    setChangesModal({ open: false, serviceId: '', serviceName: '', serviceType: '' });
    setChangesReason('');
  };
  
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'property': return Building;
      case 'vehicle': return Car;
      case 'tour': return MapPin;
      default: return Building;
    }
  };
  
  const getServiceColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-blue-100 text-blue-800';
      case 'vehicle': return 'bg-green-100 text-green-800';
      case 'tour': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatPrice = (price: number, currency: string = 'PKR') => {
    return `${currency} ${price.toLocaleString()}`;
  };
  
  const allServices = [
    ...pendingProperties.map(p => ({ ...p, type: 'property' as const })),
    ...pendingVehicles.map(v => ({ ...v, type: 'vehicle' as const })),
    ...pendingTours.map(t => ({ ...t, type: 'tour' as const }))
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Service Approvals</h1>
          <p className="text-gray-600">Review and approve service listings</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Pending: {allServices.length}
          </div>
        </div>
      </div>
      
      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'pending', label: 'PENDING', count: statusCounts.pending },
            { id: 'requires_changes', label: 'INFO REQUESTED', count: statusCounts.requiresChanges },
            { id: 'under_review', label: 'UNDER REVIEW', count: statusCounts.underReview }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('status', tab.id);
                setSearchParams(newParams);
              }}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                filters.status === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filters.status === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Service Type:</label>
            <select
              value={filters.serviceType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('serviceType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="properties">Properties ({serviceCounts.properties})</option>
              <option value="vehicles">Vehicles ({serviceCounts.vehicles})</option>
              <option value="tours">Tours ({serviceCounts.tours})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort:</label>
            <select
              value={filters.sort}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sort', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, owner, location..."
              value={filters.search}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('search', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Service Listings */}
      <div className="space-y-4">
        {allServices.length === 0 ? (
          <Card className="p-8 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Services</h3>
            <p className="text-gray-600">All service listings have been reviewed.</p>
          </Card>
        ) : (
          allServices.map((service) => {
            const ServiceIcon = getServiceIcon(service.type);
            const isExpanded = expandedService === service.id;
            const owner = service.type === 'property' ? service.owner : 
                         service.type === 'vehicle' ? service.owner : 
                         service.guide;
            
            return (
              <Card key={service.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Service Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      {service.images && service.images.length > 0 ? (
                        <img 
                          src={service.images[0]} 
                          alt={service.name || service.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ServiceIcon className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.name || service.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(service.type)}`}>
                          {service.type.toUpperCase()}
                        </span>
                        {service.type === 'property' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {service.type}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <LocationIcon className="w-4 h-4" />
                          <span>{service.city}, {service.country}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {service.type === 'property' ? formatPrice(service.basePrice) + '/night' :
                             service.type === 'vehicle' ? formatPrice(service.basePrice) + '/day' :
                             formatPrice(service.pricePerPerson) + '/person'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Listed {new Date(service.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Owner: {owner?.name} {owner?.verified && <CheckCircle className="w-4 h-4 text-green-500 inline" />}</span>
                        </div>
                      </div>
                      
                      {/* Service Details */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                      
                      {/* Service-specific details */}
                      {service.type === 'property' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-4">
                          <div>• Type: {service.type}</div>
                          <div>• Bedrooms: {service.bedrooms}</div>
                          <div>• Bathrooms: {service.bathrooms}</div>
                          <div>• Max Guests: {service.maxGuests}</div>
                        </div>
                      )}
                      
                      {service.type === 'vehicle' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-4">
                          <div>• Brand: {service.brand}</div>
                          <div>• Model: {service.model}</div>
                          <div>• Year: {service.year}</div>
                          <div>• Seats: {service.seats}</div>
                        </div>
                      )}
                      
                      {service.type === 'tour' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-4">
                          <div>• Duration: {service.duration}h</div>
                          <div>• Group Size: {service.groupSize}</div>
                          <div>• Difficulty: {service.difficulty}</div>
                          <div>• Languages: {service.languages?.join(', ')}</div>
                        </div>
                      )}
                      
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => setExpandedService(isExpanded ? null : service.id)}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Quality Check:</h5>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Images are high quality and accurate</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Description is clear and detailed</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Pricing is reasonable</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Location is accurate</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">No prohibited content</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Meets platform standards</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Admin Notes:</h5>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                rows={4}
                                placeholder="Add internal notes about this listing..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(service.id, service.type)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve & Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(service.id, service.name || service.title, service.type)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestChanges(service.id, service.name || service.title, service.type)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Request Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/admin/services/${service.type}/${service.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Service Listing
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Rejecting {rejectModal.serviceType} listing: <strong>{rejectModal.serviceName}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (will be sent to owner):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setRejectModal({ open: false, serviceId: '', serviceName: '', serviceType: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReject}
                  disabled={!rejectReason.trim() || fetcher.state === 'submitting'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {fetcher.state === 'submitting' ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Request Changes Modal */}
      {changesModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Changes
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Requesting changes for {changesModal.serviceType} listing: <strong>{changesModal.serviceName}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific issues to fix:
                </label>
                <textarea
                  value={changesReason}
                  onChange={(e) => setChangesReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please specify what needs to be changed..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setChangesModal({ open: false, serviceId: '', serviceName: '', serviceType: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitChangesRequest}
                  disabled={!changesReason.trim() || fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
