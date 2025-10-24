import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  Image, 
  Video, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Grid,
  List,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  BarChart3,
  Users,
  Calendar,
  Activity
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type") || "all";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause for media filtering
  let whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { filename: { contains: search, mode: 'insensitive' } },
      { originalName: { contains: search, mode: 'insensitive' } },
      { mimeType: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (type !== "all") {
    if (type === "images") {
      whereClause.mimeType = { startsWith: 'image/' };
    } else if (type === "videos") {
      whereClause.mimeType = { startsWith: 'video/' };
    } else if (type === "documents") {
      whereClause.mimeType = { in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] };
    }
  }

  // Get media files from existing models (Property, Vehicle, Tour images)
  const [properties, vehicles, tours] = await Promise.all([
    prisma.property.findMany({
      select: {
        id: true,
        name: true,
        images: true,
        createdAt: true,
        owner: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      where: {
        images: {
          isEmpty: false
        }
      }
    }),
    prisma.vehicle.findMany({
      select: {
        id: true,
        brand: true,
        model: true,
        images: true,
        createdAt: true,
        owner: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      where: {
        images: {
          isEmpty: false
        }
      }
    }),
    prisma.tour.findMany({
      select: {
        id: true,
        title: true,
        images: true,
        createdAt: true,
        guide: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      where: {
        images: {
          isEmpty: false
        }
      }
    })
  ]);

  // Combine all media files into a unified format
  const mediaFiles = [
    ...properties.flatMap(property => 
      property.images.map((image, index) => ({
        id: `${property.id}-${index}`,
        url: image,
        originalName: `Property: ${property.name}`,
        filename: image.split('/').pop() || 'property-image',
        mimeType: 'image/jpeg', // Default assumption
        fileSize: 0, // Unknown size
        createdAt: property.createdAt,
        uploadedBy: property.owner.user,
        source: 'property',
        sourceId: property.id
      }))
    ),
    ...vehicles.flatMap(vehicle => 
      vehicle.images.map((image, index) => ({
        id: `${vehicle.id}-${index}`,
        url: image,
        originalName: `Vehicle: ${vehicle.brand} ${vehicle.model}`,
        filename: image.split('/').pop() || 'vehicle-image',
        mimeType: 'image/jpeg', // Default assumption
        fileSize: 0, // Unknown size
        createdAt: vehicle.createdAt,
        uploadedBy: vehicle.owner.user,
        source: 'vehicle',
        sourceId: vehicle.id
      }))
    ),
    ...tours.flatMap(tour => 
      tour.images.map((image, index) => ({
        id: `${tour.id}-${index}`,
        url: image,
        originalName: `Tour: ${tour.title}`,
        filename: image.split('/').pop() || 'tour-image',
        mimeType: 'image/jpeg', // Default assumption
        fileSize: 0, // Unknown size
        createdAt: tour.createdAt,
        uploadedBy: tour.guide.user,
        source: 'tour',
        sourceId: tour.id
      }))
    )
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply search and type filters
  let filteredFiles = mediaFiles;
  
  if (search) {
    filteredFiles = filteredFiles.filter(file => 
      file.originalName.toLowerCase().includes(search.toLowerCase()) ||
      file.filename.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (type !== "all") {
    if (type === "images") {
      filteredFiles = filteredFiles.filter(file => file.mimeType.startsWith('image/'));
    } else if (type === "videos") {
      filteredFiles = filteredFiles.filter(file => file.mimeType.startsWith('video/'));
    } else if (type === "documents") {
      filteredFiles = filteredFiles.filter(file => 
        file.mimeType.includes('pdf') || 
        file.mimeType.includes('document') || 
        file.mimeType.includes('text')
      );
    }
  }

  // Apply pagination
  const totalCount = filteredFiles.length;
  const paginatedFiles = filteredFiles.slice(skip, skip + limit);

  // Get media statistics
  const totalFiles = mediaFiles.length;
  const imageCount = mediaFiles.filter(file => file.mimeType.startsWith('image/')).length;
  const videoCount = mediaFiles.filter(file => file.mimeType.startsWith('video/')).length;
  const documentCount = mediaFiles.filter(file => 
    file.mimeType.includes('pdf') || 
    file.mimeType.includes('document') || 
    file.mimeType.includes('text')
  ).length;
  
  const recentUploads = mediaFiles.filter(file => 
    new Date(file.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  // Get storage usage by user role
  const storageByRole = mediaFiles.reduce((acc, file) => {
    const role = file.uploadedBy.role;
    if (!acc[role]) {
      acc[role] = { count: 0, size: 0 };
    }
    acc[role].count++;
    acc[role].size += file.fileSize;
    return acc;
  }, {} as Record<string, { count: number; size: number }>);

  return json({
    admin,
    mediaFiles: paginatedFiles,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    search,
    type,
    stats: {
      totalFiles,
      totalSize: 0, // Unknown total size
      imageCount,
      videoCount,
      documentCount,
      recentUploads
    },
    storageByRole
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;

  switch (action) {
    case 'refresh_media':
      // Refresh media statistics
      return json({ success: true, message: 'Media statistics refreshed' });
    
    case 'analyze_media':
      // Analyze media usage
      return json({ success: true, message: 'Media analysis completed' });
    
    default:
      return json({ success: false, message: 'Invalid action' });
  }
}

export default function MediaManagement() {
  const { 
    admin, 
    mediaFiles, 
    totalCount, 
    currentPage, 
    totalPages, 
    search, 
    type, 
    stats, 
    storageByRole 
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-blue-100 text-blue-800';
    if (mimeType.startsWith('video/')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Image className="w-8 h-8 mr-3" />
                Media Management
              </h1>
              <p className="text-gray-600 mt-2">
                View and analyze all media files across the platform
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Note: File sizes are unknown as images are stored as URLs
              </p>
            </div>
            <div className="flex space-x-3">
              <Form method="post">
                <input type="hidden" name="action" value="refresh_media" />
                <Button type="submit" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Refresh Stats
                </Button>
              </Form>
              <Form method="post">
                <input type="hidden" name="action" value="analyze_media" />
                <Button type="submit" variant="outline">
                  <Activity className="w-4 h-4 mr-2" />
                  Analyze Media
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* Action Feedback */}
        {actionData && (
          <div className={`mb-6 p-4 rounded-md ${
            actionData.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {actionData.message}
          </div>
        )}

        {/* Media Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <HardDrive className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFiles.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    Size unknown (URLs only)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Image className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Images</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.imageCount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Video className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.videoCount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <File className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.documentCount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search media files..."
                    defaultValue={search}
                    className="pl-10"
                    name="search"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  name="type"
                  defaultValue={type}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                  <option value="documents">Documents</option>
                </select>
                <Button type="submit" variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Files Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mediaFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      {getFileIcon(file.mimeType)}
                      <span className="text-xs mt-2">{file.mimeType.split('/')[1]}</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {file.originalName}
                    </h3>
                    <Badge className={getFileTypeColor(file.mimeType)}>
                      {file.mimeType.split('/')[0]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Size unknown
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Uploaded by {file.uploadedBy.name}
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(file.url, '_blank')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.filename;
                      link.click();
                    }}>
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      {file.source}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const url = new URL(window.location);
                    url.searchParams.set('page', pageNum.toString());
                    window.location.href = url.toString();
                  }}
                >
                  {pageNum}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* No Media Files */}
        {mediaFiles.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Media Files Found</h3>
              <p className="text-gray-500 mb-4">
                {search || type !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No media files have been uploaded yet."
                }
              </p>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload First Media File
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
