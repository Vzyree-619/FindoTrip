import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  XCircle, 
  Building, 
  Car, 
  MapPin, 
  User,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  Star,
  DollarSign,
  MapPin as LocationIcon,
  RotateCcw,
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const type = url.searchParams.get('type') || 'all';
  const sort = url.searchParams.get('sort') || 'newest';
  const dateFrom = url.searchParams.get('dateFrom') || '';
  const dateTo = url.searchParams.get('dateTo') || '';
  
  // Build where clause
  const whereClause: any = {
    approvalStatus: 'REJECTED'
  };
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (dateFrom || dateTo) {
    whereClause.approvedAt = {};
    if (dateFrom) whereClause.approvedAt.gte = new Date(dateFrom);
    if (dateTo) whereClause.approvedAt.lte = new Date(dateTo);
  }
  
  // Get rejected items
  const [rejectedProperties, rejectedVehicles, rejectedTours, rejectedProviders] = await Promise.all([
    // Rejected Properties
    type === 'all' || type === 'properties' ? 
    prisma.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            propertyOwner: {
              select: {
                businessName: true
              }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { approvedAt: 'desc' } : { approvedAt: 'asc' }
    }) : [],
    
    // Rejected Vehicles
    type === 'all' || type === 'vehicles' ? 
    prisma.vehicle.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            vehicleOwner: {
              select: {
                businessName: true
              }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { approvedAt: 'desc' } : { approvedAt: 'asc' }
    }) : [],
    
    // Rejected Tours
    type === 'all' || type === 'tours' ? 
    prisma.tour.findMany({
      where: whereClause,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
            tourGuide: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: sort === 'newest' ? { approvedAt: 'desc' } : { approvedAt: 'asc' }
    }) : [],
    
    // Rejected Providers (users with verified: false and specific criteria)
    type === 'all' || type === 'providers' ? 
    prisma.user.findMany({
      where: {
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
        verified: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        propertyOwner: {
          select: {
            businessName: true,
            verificationLevel: true
          }
        },
        vehicleOwner: {
          select: {
            businessName: true,
            verificationLevel: true
          }
        },
        tourGuide: {
          select: {
            firstName: true,
            lastName: true,
            verificationLevel: true
          }
        }
      },
      orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' }
    }) : []
  ]);
  
  // Get counts
  const counts = await Promise.all([
    prisma.property.count({ where: { approvalStatus: 'REJECTED' } }),
    prisma.vehicle.count({ where: { approvalStatus: 'REJECTED' } }),
    prisma.tour.count({ where: { approvalStatus: 'REJECTED' } }),
    prisma.user.count({ 
      where: { 
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
        verified: false,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      } 
    })
  ]);
  
  // Get common rejection reasons
  const rejectionReasons = await Promise.all([
    prisma.property.findMany({
      where: { approvalStatus: 'REJECTED' },
      select: { rejectionReason: true }
    }),
    prisma.vehicle.findMany({
      where: { approvalStatus: 'REJECTED' },
      select: { rejectionReason: true }
    }),
    prisma.tour.findMany({
      where: { approvalStatus: 'REJECTED' },
      select: { rejectionReason: true }
    })
  ]);
  
  const allReasons = rejectionReasons.flat().map(item => item.rejectionReason).filter(Boolean);
  const reasonCounts = allReasons.reduce((acc, reason) => {
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return json({
    admin,
    rejectedProperties,
    rejectedVehicles,
    rejectedTours,
    rejectedProviders,
    counts: {
      properties: counts[0],
      vehicles: counts[1],
      tours: counts[2],
      providers: counts[3]
    },
    rejectionReasons: Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10),
    filters: { search, type, sort, dateFrom, dateTo }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const itemId = formData.get('itemId') as string;
  const itemType = formData.get('itemType') as string;
  
  try {
    if (action === 'overturn_rejection') {
      // Overturn rejection - move back to pending
      if (itemType === 'property') {
        await prisma.property.update({
          where: { id: itemId },
          data: { 
            approvalStatus: 'PENDING',
            rejectionReason: null,
            approvedBy: null,
            approvedAt: null
          }
        });
      } else if (itemType === 'vehicle') {
        await prisma.vehicle.update({
          where: { id: itemId },
          data: { 
            approvalStatus: 'PENDING',
            rejectionReason: null,
            approvedBy: null,
            approvedAt: null
          }
        });
      } else if (itemType === 'tour') {
        await prisma.tour.update({
          where: { id: itemId },
          data: { 
            approvalStatus: 'PENDING',
            rejectionReason: null,
            approvedBy: null,
            approvedAt: null
          }
        });
      }
      
      await logAdminAction(admin.id, 'REJECTION_OVERTURNED', `Overturned rejection for ${itemType}: ${itemId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Rejection overturn action error:', error);
    return json({ success: false, error: 'Failed to overturn rejection' }, { status: 500 });
  }
}

export default function RejectedItems() {
  const { admin, rejectedProperties, rejectedVehicles, rejectedTours, rejectedProviders, counts, rejectionReasons, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [overturnModal, setOverturnModal] = useState<{ open: boolean; itemId: string; itemName: string; itemType: string }>({
    open: false,
    itemId: '',
    itemName: '',
    itemType: ''
  });
  
  const fetcher = useFetcher();
  
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'property': return Building;
      case 'vehicle': return Car;
      case 'tour': return MapPin;
      case 'provider': return User;
      default: return Building;
    }
  };
  
  const getServiceColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-blue-100 text-blue-800';
      case 'vehicle': return 'bg-green-100 text-green-800';
      case 'tour': return 'bg-purple-100 text-purple-800';
      case 'provider': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatPrice = (price: number, currency: string = 'PKR') => {
    return `${currency} ${price.toLocaleString()}`;
  };
  
  const allRejectedItems = [
    ...rejectedProperties.map(p => ({ ...p, type: 'property' as const })),
    ...rejectedVehicles.map(v => ({ ...v, type: 'vehicle' as const })),
    ...rejectedTours.map(t => ({ ...t, type: 'tour' as const })),
    ...rejectedProviders.map(p => ({ ...p, type: 'provider' as const }))
  ];
  
  const handleOverturn = (itemId: string, itemName: string, itemType: string) => {
    setOverturnModal({ open: true, itemId, itemName, itemType });
  };
  
  const confirmOverturn = () => {
    const formData = new FormData();
    formData.append('action', 'overturn_rejection');
    formData.append('itemId', overturnModal.itemId);
    formData.append('itemType', overturnModal.itemType);
    fetcher.submit(formData, { method: 'post' });
    
    setOverturnModal({ open: false, itemId: '', itemName: '', itemType: '' });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rejected Items</h1>
          <p className="text-gray-600">History of all rejected providers and service listings</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => window.print()} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{counts.properties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">{counts.vehicles}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tours</p>
              <p className="text-2xl font-bold text-gray-900">{counts.tours}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Providers</p>
              <p className="text-2xl font-bold text-gray-900">{counts.providers}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Common Rejection Reasons */}
      {rejectionReasons.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Rejection Reasons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rejectionReasons.map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{reason}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Type:</label>
            <select
              value={filters.type}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('type', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="properties">Properties ({counts.properties})</option>
              <option value="vehicles">Vehicles ({counts.vehicles})</option>
              <option value="tours">Tours ({counts.tours})</option>
              <option value="providers">Providers ({counts.providers})</option>
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
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('dateFrom', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('dateTo', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search rejected items..."
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
      
      {/* Rejected Items List */}
      <div className="space-y-4">
        {allRejectedItems.length === 0 ? (
          <Card className="p-8 text-center">
            <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rejected Items</h3>
            <p className="text-gray-600">No items match your current filters.</p>
          </Card>
        ) : (
          allRejectedItems.map((item) => {
            const ServiceIcon = getServiceIcon(item.type);
            const owner = item.type === 'property' ? item.owner : 
                         item.type === 'vehicle' ? item.owner : 
                         item.type === 'tour' ? item.guide : 
                         null;
            
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ServiceIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name || item.title || `${item.firstName} ${item.lastName}` || item.email}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(item.type)}`}>
                        {item.type.toUpperCase()}
                      </span>
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Rejected</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Rejected: {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : 
                                   new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {owner && (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Owner: {owner.name}</span>
                        </div>
                      )}
                      
                      {item.type !== 'provider' && (
                        <div className="flex items-center space-x-2">
                          <LocationIcon className="w-4 h-4" />
                          <span>{item.city}, {item.country}</span>
                        </div>
                      )}
                      
                      {item.rejectionReason && (
                        <div className="flex items-center space-x-2 col-span-full">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-red-600 font-medium">Reason: {item.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOverturn(item.id, item.name || item.title || item.email, item.type)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Overturn
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/services/${item.type}/${item.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Overturn Modal */}
      {overturnModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Overturn Rejection
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to overturn the rejection for:
                </p>
                <p className="font-medium text-gray-900">{overturnModal.itemName}</p>
                <p className="text-sm text-gray-600 mt-1">
                  This will move the item back to pending status for review.
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setOverturnModal({ open: false, itemId: '', itemName: '', itemType: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmOverturn}
                  disabled={fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Overturning...' : 'Confirm Overturn'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
