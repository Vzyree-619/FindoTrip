import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams, Link } from "@remix-run/react";
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
  MapPin as LocationIcon,
  FileText,
  Download,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || '';
  const sort = url.searchParams.get('sort') || 'oldest';
  
  // Build where clause
  const whereClause: any = {
    role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
    verified: false
  };
  
  if (role && role !== 'all') {
    whereClause.role = role;
  }
  
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  // Get pending provider applications with detailed information
  const pendingProviders = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      avatar: true,
      createdAt: true,
      lastLogin: true,
      // Include role-specific profiles
      propertyOwner: {
        select: {
          businessName: true,
          businessType: true,
          businessLicense: true,
          businessPhone: true,
          businessEmail: true,
          businessAddress: true,
          businessCity: true,
          businessCountry: true,
          verificationLevel: true,
          documentsSubmitted: true,
          totalProperties: true,
          averageRating: true
        }
      },
      vehicleOwner: {
        select: {
          businessName: true,
          businessType: true,
          businessLicense: true,
          transportLicense: true,
          insuranceProvider: true,
          insurancePolicy: true,
          insuranceExpiry: true,
          businessPhone: true,
          businessEmail: true,
          businessAddress: true,
          businessCity: true,
          businessCountry: true,
          drivingLicense: true,
          licenseExpiry: true,
          drivingExperience: true,
          languages: true,
          verificationLevel: true,
          documentsSubmitted: true,
          backgroundCheck: true,
          totalVehicles: true,
          averageRating: true
        }
      },
      tourGuide: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          nationality: true,
          guideLicense: true,
          licenseExpiry: true,
          yearsOfExperience: true,
          languages: true,
          specializations: true,
          certifications: true,
          businessPhone: true,
          businessEmail: true,
          serviceAreas: true,
          maxGroupSize: true,
          minGroupSize: true,
          pricePerPerson: true,
          availableDays: true,
          workingHours: true,
          advanceBooking: true,
          verificationLevel: true,
          documentsSubmitted: true,
          backgroundCheck: true,
          totalTours: true,
          averageRating: true
        }
      },
      // Include documents
      documents: {
        select: {
          id: true,
          type: true,
          name: true,
          url: true,
          verified: true,
          verifiedAt: true,
          rejectionReason: true
        }
      }
    },
    orderBy: sort === 'newest' ? { createdAt: 'desc' } : { createdAt: 'asc' }
  });
  
  // Get counts by role
  const roleCounts = await Promise.all([
    prisma.user.count({ where: { role: 'PROPERTY_OWNER', verified: false } }),
    prisma.user.count({ where: { role: 'VEHICLE_OWNER', verified: false } }),
    prisma.user.count({ where: { role: 'TOUR_GUIDE', verified: false } })
  ]);
  
  return json({
    admin,
    pendingProviders,
    roleCounts: {
      propertyOwners: roleCounts[0],
      vehicleOwners: roleCounts[1],
      tourGuides: roleCounts[2]
    },
    filters: { search, role, sort }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const providerId = formData.get('providerId') as string;
  const reason = formData.get('reason') as string;
  const notes = formData.get('notes') as string;
  
  try {
    if (action === 'approve') {
      // Update user verification status
      await prisma.user.update({
        where: { id: providerId },
        data: { 
          verified: true,
          updatedAt: new Date()
        }
      });
      
      // Update role-specific profile
      const user = await prisma.user.findUnique({
        where: { id: providerId },
        select: { role: true }
      });
      
      if (user?.role === 'PROPERTY_OWNER') {
        await prisma.propertyOwner.updateMany({
          where: { userId: providerId },
          data: { 
            verified: true,
            verificationLevel: 'VERIFIED',
            updatedAt: new Date()
          }
        });
      } else if (user?.role === 'VEHICLE_OWNER') {
        await prisma.vehicleOwner.updateMany({
          where: { userId: providerId },
          data: { 
            verified: true,
            verificationLevel: 'VERIFIED',
            updatedAt: new Date()
          }
        });
      } else if (user?.role === 'TOUR_GUIDE') {
        await prisma.tourGuide.updateMany({
          where: { userId: providerId },
          data: { 
            verified: true,
            verificationLevel: 'VERIFIED',
            updatedAt: new Date()
          }
        });
      }
      
      // Create notification for provider
      await prisma.notification.create({
        data: {
          userId: providerId,
          type: 'PROFILE_VERIFIED',
          title: 'Account Approved!',
          message: 'Congratulations! Your account has been approved. You can now start adding services to the platform.',
          userRole: user?.role || 'CUSTOMER'
        }
      });
      
      await logAdminAction(admin.id, 'PROVIDER_APPROVED', `Approved provider: ${providerId}`, request);
      
    } else if (action === 'reject') {
      // Update user verification status
      await prisma.user.update({
        where: { id: providerId },
        data: { 
          verified: false,
          updatedAt: new Date()
        }
      });
      
      // Create notification for provider
      await prisma.notification.create({
        data: {
          userId: providerId,
          type: 'PROFILE_VERIFIED',
          title: 'Application Not Approved',
          message: `Your application was not approved. Reason: ${reason}`,
          userRole: 'CUSTOMER'
        }
      });
      
      await logAdminAction(admin.id, 'PROVIDER_REJECTED', `Rejected provider: ${providerId}. Reason: ${reason}`, request);
      
    } else if (action === 'request_info') {
      // Create notification requesting more information
      await prisma.notification.create({
        data: {
          userId: providerId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Additional Information Required',
          message: `We need additional information to process your application. ${notes}`,
          userRole: 'CUSTOMER'
        }
      });
      
      await logAdminAction(admin.id, 'PROVIDER_INFO_REQUESTED', `Requested additional info from provider: ${providerId}`, request);
    } else if (action === 'toggle_verify') {
      // Explicitly toggle provider verification without relying on properties
      const user = await prisma.user.findUnique({ where: { id: providerId }, select: { role: true, verified: true } });
      const next = !user?.verified;
      await prisma.user.update({ where: { id: providerId }, data: { verified: next } });
      if (user?.role === 'PROPERTY_OWNER') {
        await prisma.propertyOwner.updateMany({ where: { userId: providerId }, data: { verified: next, verificationLevel: next ? 'VERIFIED' : 'BASIC' } });
      } else if (user?.role === 'VEHICLE_OWNER') {
        await prisma.vehicleOwner.updateMany({ where: { userId: providerId }, data: { verified: next, verificationLevel: next ? 'VERIFIED' : 'BASIC' } });
      } else if (user?.role === 'TOUR_GUIDE') {
        await prisma.tourGuide.updateMany({ where: { userId: providerId }, data: { verified: next, verificationLevel: next ? 'VERIFIED' : 'BASIC' } });
      }
      await logAdminAction(admin.id, next ? 'PROVIDER_VERIFIED' : 'PROVIDER_UNVERIFIED', `${next ? 'Verified' : 'Unverified'} provider: ${providerId}`, request);
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Provider approval action error:', error);
    return json({ success: false, error: 'Failed to process approval' }, { status: 500 });
  }
}

export default function PendingProviderApprovals() {
  const { admin, pendingProviders, roleCounts, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; providerId: string; providerName: string }>({
    open: false,
    providerId: '',
    providerName: ''
  });
  const [infoModal, setInfoModal] = useState<{ open: boolean; providerId: string; providerName: string }>({
    open: false,
    providerId: '',
    providerName: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [infoNotes, setInfoNotes] = useState('');
  
  const fetcher = useFetcher();
  
  const handleApprove = (providerId: string) => {
    const formData = new FormData();
    formData.append('action', 'approve');
    formData.append('providerId', providerId);
    fetcher.submit(formData, { method: 'post' });
  };
  
  const handleReject = (providerId: string, providerName: string) => {
    setRejectModal({ open: true, providerId, providerName });
    setRejectReason('');
  };
  
  const handleRequestInfo = (providerId: string, providerName: string) => {
    setInfoModal({ open: true, providerId, providerName });
    setInfoNotes('');
  };
  
  const submitReject = () => {
    if (!rejectReason.trim()) return;
    
    const formData = new FormData();
    formData.append('action', 'reject');
    formData.append('providerId', rejectModal.providerId);
    formData.append('reason', rejectReason);
    fetcher.submit(formData, { method: 'post' });
    
    setRejectModal({ open: false, providerId: '', providerName: '' });
    setRejectReason('');
  };
  
  const submitInfoRequest = () => {
    if (!infoNotes.trim()) return;
    
    const formData = new FormData();
    formData.append('action', 'request_info');
    formData.append('providerId', infoModal.providerId);
    formData.append('notes', infoNotes);
    fetcher.submit(formData, { method: 'post' });
    
    setInfoModal({ open: false, providerId: '', providerName: '' });
    setInfoNotes('');
  };
  
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
  
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'BUSINESS_LICENSE': return 'Business License';
      case 'NATIONAL_ID': return 'National ID';
      case 'PASSPORT': return 'Passport';
      case 'DRIVING_LICENSE': return 'Driving License';
      case 'TAX_CERTIFICATE': return 'Tax Certificate';
      case 'INSURANCE_DOCUMENT': return 'Insurance Document';
      case 'VEHICLE_REGISTRATION': return 'Vehicle Registration';
      case 'TOUR_GUIDE_LICENSE': return 'Tour Guide License';
      default: return type.replace('_', ' ');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Provider Approvals</h1>
          <p className="text-gray-600">Review and approve provider applications</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Total Pending: {pendingProviders.length}
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Role:</label>
            <select
              value={filters.role}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('role', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="PROPERTY_OWNER">Property Owners ({roleCounts.propertyOwners})</option>
              <option value="VEHICLE_OWNER">Vehicle Owners ({roleCounts.vehicleOwners})</option>
              <option value="TOUR_GUIDE">Tour Guides ({roleCounts.tourGuides})</option>
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
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
      
      {/* Provider Applications */}
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
            const isExpanded = expandedProvider === provider.id;
            const profile = provider.propertyOwner || provider.vehicleOwner || provider.tourGuide;
            
            return (
              <Card key={provider.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
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
                        {provider.lastLogin && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Last login: {new Date(provider.lastLogin).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Business Details */}
                      {profile && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Business Details:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            {profile.businessName && (
                              <div>• Company Name: {profile.businessName}</div>
                            )}
                            {profile.businessType && (
                              <div>• Business Type: {profile.businessType}</div>
                            )}
                            {profile.businessPhone && (
                              <div>• Business Phone: {profile.businessPhone}</div>
                            )}
                            {profile.businessEmail && (
                              <div>• Business Email: {profile.businessEmail}</div>
                            )}
                            {profile.businessAddress && (
                              <div>• Address: {profile.businessAddress}</div>
                            )}
                            {profile.businessCity && (
                              <div>• City: {profile.businessCity}</div>
                            )}
                            {profile.businessCountry && (
                              <div>• Country: {profile.businessCountry}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Documents */}
                      {provider.documents && provider.documents.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Documents:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {provider.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">{getDocumentTypeLabel(doc.type)}</span>
                                  {doc.verified && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-4 h-4" />
                                    </a>
                                  </Button>
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={doc.url} download>
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
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
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Verification Checklist:</h5>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Documents verified</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Background check passed</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Business registration confirmed</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input type="checkbox" className="rounded" />
                                  <span className="text-sm text-gray-600">Contact information verified</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Admin Notes (internal):</h5>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                rows={4}
                                placeholder="Add internal notes about this application..."
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
                      onClick={() => {
                        const fd = new FormData();
                        fd.append('action', 'toggle_verify');
                        fd.append('providerId', provider.id);
                        fetcher.submit(fd, { method: 'post' });
                      }}
                      disabled={fetcher.state === 'submitting'}
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      {provider.verified ? 'Unverify' : 'Verify'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(provider.id)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(provider.id, provider.name)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestInfo(provider.id, provider.name)}
                      disabled={fetcher.state === 'submitting'}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Request Info
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/admin/users/${provider.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
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
              Reject Provider Application
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Rejecting application for: <strong>{rejectModal.providerName}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (will be sent to applicant):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Common reasons (click to insert):</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Incomplete documentation',
                    'Invalid business license',
                    'Failed background check',
                    'Unverifiable information',
                    'Does not meet eligibility criteria'
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRejectReason(reason)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setRejectModal({ open: false, providerId: '', providerName: '' })}
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
      
      {/* Request Info Modal */}
      {infoModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Additional Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Requesting additional information from: <strong>{infoModal.providerName}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to provider:
                </label>
                <textarea
                  value={infoNotes}
                  onChange={(e) => setInfoNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Please specify what additional information is needed..."
                />
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Templates:</p>
                <div className="space-y-1">
                  {[
                    'Please provide a clearer copy of your business license',
                    'We need additional proof of insurance',
                    'Please verify your contact information',
                    'Additional documents required: [specify]'
                  ].map((template) => (
                    <button
                      key={template}
                      onClick={() => setInfoNotes(template)}
                      className="block w-full text-left px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setInfoModal({ open: false, providerId: '', providerName: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitInfoRequest}
                  disabled={!infoNotes.trim() || fetcher.state === 'submitting'}
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
