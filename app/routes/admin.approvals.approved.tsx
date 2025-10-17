import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSearchParams, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  CheckCircle, 
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
  MapPin as LocationIcon
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
    approvalStatus: 'APPROVED'
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
  
  // Get approved items
  const [approvedProperties, approvedVehicles, approvedTours, approvedProviders] = await Promise.all([
    // Approved Properties
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
    
    // Approved Vehicles
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
    
    // Approved Tours
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
    
    // Approved Providers
    type === 'all' || type === 'providers' ? 
    prisma.user.findMany({
      where: {
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
        verified: true
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
    prisma.property.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.vehicle.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.tour.count({ where: { approvalStatus: 'APPROVED' } }),
    prisma.user.count({ 
      where: { 
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
        verified: true 
      } 
    })
  ]);
  
  return json({
    admin,
    approvedProperties,
    approvedVehicles,
    approvedTours,
    approvedProviders,
    counts: {
      properties: counts[0],
      vehicles: counts[1],
      tours: counts[2],
      providers: counts[3]
    },
    filters: { search, type, sort, dateFrom, dateTo }
  });
}

export default function ApprovedItems() {
  const { admin, approvedProperties, approvedVehicles, approvedTours, approvedProviders, counts, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
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
  
  const allApprovedItems = [
    ...approvedProperties.map(p => ({ ...p, type: 'property' as const })),
    ...approvedVehicles.map(v => ({ ...v, type: 'vehicle' as const })),
    ...approvedTours.map(t => ({ ...t, type: 'tour' as const })),
    ...approvedProviders.map(p => ({ ...p, type: 'provider' as const }))
  ];
  
  const handleSelectAll = () => {
    if (selectedItems.length === allApprovedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allApprovedItems.map(item => item.id));
    }
  };
  
  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };
  
  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting selected items:', selectedItems);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved Items</h1>
          <p className="text-gray-600">History of all approved providers and service listings</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedItems.length > 0 && (
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedItems.length})
            </Button>
          )}
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
              placeholder="Search approved items..."
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
      
      {/* Approved Items List */}
      <div className="space-y-4">
        {allApprovedItems.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Items</h3>
            <p className="text-gray-600">No items match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedItems.length === allApprovedItems.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({allApprovedItems.length} items)
              </span>
            </div>
            
            {allApprovedItems.map((item) => {
              const ServiceIcon = getServiceIcon(item.type);
              const owner = item.type === 'property' ? item.owner : 
                           item.type === 'vehicle' ? item.owner : 
                           item.type === 'tour' ? item.guide : 
                           null;
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded"
                    />
                    
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
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Approved: {item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : 
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
                        
                        {item.type === 'property' && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatPrice(item.basePrice)}/night</span>
                          </div>
                        )}
                        
                        {item.type === 'vehicle' && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatPrice(item.basePrice)}/day</span>
                          </div>
                        )}
                        
                        {item.type === 'tour' && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatPrice(item.pricePerPerson)}/person</span>
                          </div>
                        )}
                        
                        {item.rating && (
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4" />
                            <span>{item.rating.toFixed(1)} ({item.reviewCount} reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
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
            })}
          </>
        )}
      </div>
    </div>
  );
}
