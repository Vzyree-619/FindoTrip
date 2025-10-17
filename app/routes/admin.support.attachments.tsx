import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  Paperclip, 
  Download,
  Eye,
  Trash2,
  Upload,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Star,
  UserCheck,
  UserX,
  Settings,
  Activity,
  TrendingUp,
  BarChart3,
  Shield,
  BookOpen,
  Globe,
  Award,
  Flag,
  Archive as ArchiveIcon,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Bell,
  BellOff,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle2,
  Clock3,
  AlertCircle,
  Info,
  HelpCircle,
  Bug,
  Wrench,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply,
  Forward,
  Copy,
  Share,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  Target,
  Timer,
  Users,
  Tag,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const fileType = url.searchParams.get('fileType') || 'all';
  const ticketId = url.searchParams.get('ticketId') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for attachments
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { fileName: { contains: search, mode: 'insensitive' } },
      { originalName: { contains: search, mode: 'insensitive' } }
    ];
  }
  
  if (fileType !== 'all') {
    whereClause.fileType = fileType.toUpperCase();
  }
  
  if (ticketId) {
    whereClause.ticketId = ticketId;
  }
  
  // Get attachments with pagination
  const [attachments, totalCount] = await Promise.all([
    prisma.supportAttachment.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.supportAttachment.count({ where: whereClause })
  ]);
  
  // Get file type statistics
  const fileTypeStats = await Promise.all([
    prisma.supportAttachment.count({ where: { fileType: 'IMAGE' } }),
    prisma.supportAttachment.count({ where: { fileType: 'DOCUMENT' } }),
    prisma.supportAttachment.count({ where: { fileType: 'VIDEO' } }),
    prisma.supportAttachment.count({ where: { fileType: 'AUDIO' } }),
    prisma.supportAttachment.count({ where: { fileType: 'ARCHIVE' } }),
    prisma.supportAttachment.count({ where: { fileType: 'OTHER' } })
  ]);
  
  // Get total storage used
  const storageStats = await prisma.supportAttachment.aggregate({
    _sum: {
      fileSize: true
    }
  });
  
  return json({
    admin,
    attachments,
    totalCount,
    fileTypeStats: {
      image: fileTypeStats[0],
      document: fileTypeStats[1],
      video: fileTypeStats[2],
      audio: fileTypeStats[3],
      archive: fileTypeStats[4],
      other: fileTypeStats[5]
    },
    totalStorage: storageStats._sum.fileSize || 0,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, fileType, ticketId }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const attachmentId = formData.get('attachmentId') as string;
  const ticketId = formData.get('ticketId') as string;
  const file = formData.get('file') as File;
  const description = formData.get('description') as string;
  
  try {
    if (action === 'upload') {
      // Handle file upload
      if (!file || file.size === 0) {
        return json({ success: false, error: 'No file provided' }, { status: 400 });
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return json({ success: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
      }
      
      // Determine file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let fileType = 'OTHER';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension || '')) {
        fileType = 'IMAGE';
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileExtension || '')) {
        fileType = 'DOCUMENT';
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(fileExtension || '')) {
        fileType = 'VIDEO';
      } else if (['mp3', 'wav', 'flac', 'aac'].includes(fileExtension || '')) {
        fileType = 'AUDIO';
      } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension || '')) {
        fileType = 'ARCHIVE';
      }
      
      // Create attachment record
      const attachment = await prisma.supportAttachment.create({
        data: {
          ticketId: ticketId,
          fileName: file.name,
          originalName: file.name,
          fileType: fileType,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: admin.id,
          description: description || null
        }
      });
      
      await logAdminAction(admin.id, 'UPLOAD_ATTACHMENT', `Uploaded attachment: ${file.name}`, request);
      return json({ success: true, attachment });
      
    } else if (action === 'delete') {
      await prisma.supportAttachment.delete({
        where: { id: attachmentId }
      });
      
      await logAdminAction(admin.id, 'DELETE_ATTACHMENT', `Deleted attachment: ${attachmentId}`, request);
      return json({ success: true });
    }
    
    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Attachment action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function Attachments() {
  const { admin, attachments, totalCount, fileTypeStats, totalStorage, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; ticketId: string }>({
    open: false,
    ticketId: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedAttachments.length === attachments.length) {
      setSelectedAttachments([]);
    } else {
      setSelectedAttachments(attachments.map(a => a.id));
    }
  };
  
  const handleSelectAttachment = (attachmentId: string) => {
    setSelectedAttachments(prev => 
      prev.includes(attachmentId) 
        ? prev.filter(id => id !== attachmentId)
        : [...prev, attachmentId]
    );
  };
  
  const handleUpload = () => {
    if (!uploadFile) return;
    
    const formData = new FormData();
    formData.append('action', 'upload');
    formData.append('ticketId', uploadModal.ticketId);
    formData.append('file', uploadFile);
    formData.append('description', uploadDescription);
    fetcher.submit(formData, { method: 'post' });
    
    setUploadModal({ open: false, ticketId: '' });
    setUploadFile(null);
    setUploadDescription('');
  };
  
  const handleDelete = (attachmentId: string) => {
    if (confirm('Are you sure you want to delete this attachment?')) {
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('attachmentId', attachmentId);
      fetcher.submit(formData, { method: 'post' });
    }
  };
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE': return Image;
      case 'DOCUMENT': return FileText;
      case 'VIDEO': return Video;
      case 'AUDIO': return Music;
      case 'ARCHIVE': return Archive;
      default: return File;
    }
  };
  
  const getFileColor = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE': return 'text-green-600';
      case 'DOCUMENT': return 'text-blue-600';
      case 'VIDEO': return 'text-purple-600';
      case 'AUDIO': return 'text-orange-600';
      case 'ARCHIVE': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Attachments</h1>
          <p className="text-gray-600">Manage support ticket file attachments</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedAttachments.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Selected ({selectedAttachments.length})
            </Button>
          )}
          <Button onClick={() => setUploadModal({ open: true, ticketId: '' })} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Image className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Images</p>
              <p className="text-2xl font-bold text-gray-900">{fileTypeStats.image}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{fileTypeStats.document}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Videos</p>
              <p className="text-2xl font-bold text-gray-900">{fileTypeStats.video}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Music className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Audio</p>
              <p className="text-2xl font-bold text-gray-900">{fileTypeStats.audio}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Archive className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Archives</p>
              <p className="text-2xl font-bold text-gray-900">{fileTypeStats.archive}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <File className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Other</p>
              <p className="text-2xl font-bold text-gray-900">{fileTypeStats.other}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Storage Usage */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Storage Used</p>
            <p className="text-2xl font-bold text-gray-900">{formatFileSize(totalStorage)}</p>
          </div>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
      </Card>
      
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">File Type:</label>
            <select
              value={filters.fileType}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('fileType', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images ({fileTypeStats.image})</option>
              <option value="document">Documents ({fileTypeStats.document})</option>
              <option value="video">Videos ({fileTypeStats.video})</option>
              <option value="audio">Audio ({fileTypeStats.audio})</option>
              <option value="archive">Archives ({fileTypeStats.archive})</option>
              <option value="other">Other ({fileTypeStats.other})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search attachments..."
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
      
      {/* Attachments List */}
      <div className="space-y-4">
        {attachments.length === 0 ? (
          <Card className="p-8 text-center">
            <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attachments Found</h3>
            <p className="text-gray-600">No attachments match your current filters.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedAttachments.length === attachments.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({attachments.length} attachments)
              </span>
            </div>
            
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.fileType);
              
              return (
                <Card key={attachment.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedAttachments.includes(attachment.id)}
                      onChange={() => handleSelectAttachment(attachment.id)}
                      className="rounded"
                    />
                    
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileIcon className={`w-6 h-6 ${getFileColor(attachment.fileType)}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{attachment.fileName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFileColor(attachment.fileType)}`}>
                          {attachment.fileType}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Uploaded by {attachment.uploadedBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Uploaded {new Date(attachment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Ticket: {attachment.ticket.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Status: {attachment.ticket.status}</span>
                        </div>
                      </div>
                      
                      {attachment.description && (
                        <p className="text-sm text-gray-700 line-clamp-2">{attachment.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      
                      <Button
                        onClick={() => handleDelete(attachment.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
      
      {/* Upload Modal */}
      {uploadModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <Button
                variant="outline"
                onClick={() => setUploadModal({ open: false, ticketId: '' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept="*/*"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the file..."
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setUploadModal({ open: false, ticketId: '' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadFile || fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} attachments
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page - 1).toString());
                setSearchParams(newParams);
              }}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('page', (pagination.page + 1).toString());
                setSearchParams(newParams);
              }}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
