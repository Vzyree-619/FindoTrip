import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, useSearchParams } from "@remix-run/react";
import { requireAdmin, logAdminAction } from "~/lib/admin.server";
import { prisma } from "~/lib/db/db.server";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { 
  MessageSquare, 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  Trash2,
  Copy,
  Send,
  Tag,
  Clock,
  User,
  Mail,
  Phone,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Archive,
  Settings,
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  Zap,
  Target,
  Timer,
  Globe,
  Award,
  Flag,
  Archive as ArchiveIcon,
  Plus as PlusIcon,
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
  Reply,
  Forward,
  Share,
  Bookmark as BookmarkIcon,
  BookmarkCheck as BookmarkCheckIcon,
  Users,
  Calendar,
  Priority,
  FileText,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive as ArchiveFile
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const ticketId = url.searchParams.get('ticketId') || '';
  const author = url.searchParams.get('author') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for internal notes
  const whereClause: any = {
    isInternal: true
  };
  
  if (search) {
    whereClause.OR = [
      { content: { contains: search, mode: 'insensitive' } },
      { ticket: { subject: { contains: search, mode: 'insensitive' } } }
    ];
  }
  
  if (ticketId) {
    whereClause.ticketId = ticketId;
  }
  
  if (author !== 'all') {
    whereClause.senderId = author;
  }
  
  // Get internal notes with pagination
  const [notes, totalCount] = await Promise.all([
    prisma.supportMessage.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true
          }
        },
        sender: {
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
    prisma.supportMessage.count({ where: whereClause })
  ]);
  
  // Get note statistics
  const noteStats = await Promise.all([
    prisma.supportMessage.count({ where: { isInternal: true } }),
    prisma.supportMessage.count({ 
      where: { 
        isInternal: true,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.supportMessage.count({ 
      where: { 
        isInternal: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
  ]);
  
  // Get most active note authors
  const activeAuthors = await prisma.supportMessage.groupBy({
    by: ['senderId'],
    where: { isInternal: true },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 5
  });
  
  // Get authors with their details
  const authorsWithDetails = await Promise.all(
    activeAuthors.map(async (author) => {
      const user = await prisma.user.findUnique({
        where: { id: author.senderId },
        select: { name: true, email: true }
      });
      return {
        ...author,
        user
      };
    })
  );
  
  return json({
    admin,
    notes,
    totalCount,
    noteStats: {
      total: noteStats[0],
      last24Hours: noteStats[1],
      last7Days: noteStats[2]
    },
    activeAuthors: authorsWithDetails,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, ticketId, author }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const noteId = formData.get('noteId') as string;
  const ticketId = formData.get('ticketId') as string;
  const content = formData.get('content') as string;
  const tags = formData.get('tags') as string;
  
  try {
    if (action === 'create') {
      const newNote = await prisma.supportMessage.create({
        data: {
          ticketId: ticketId,
          senderId: admin.id,
          senderType: 'ADMIN',
          content: content,
          isInternal: true,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        }
      });
      
      await logAdminAction(admin.id, 'CREATE_INTERNAL_NOTE', `Created internal note for ticket ${ticketId}`, request);
      return json({ success: true, note: newNote });
      
    } else if (action === 'update') {
      await prisma.supportMessage.update({
        where: { id: noteId },
        data: {
          content: content,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_INTERNAL_NOTE', `Updated internal note ${noteId}`, request);
      return json({ success: true });
      
    } else if (action === 'delete') {
      await prisma.supportMessage.delete({
        where: { id: noteId }
      });
      
      await logAdminAction(admin.id, 'DELETE_INTERNAL_NOTE', `Deleted internal note ${noteId}`, request);
      return json({ success: true });
    }
    
    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Internal note action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function InternalNotes() {
  const { admin, notes, totalCount, noteStats, activeAuthors, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [noteModal, setNoteModal] = useState<{ open: boolean; mode: 'create' | 'edit'; noteId?: string; ticketId?: string }>({
    open: false,
    mode: 'create'
  });
  const [formData, setFormData] = useState({
    content: '',
    tags: ''
  });
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedNotes.length === notes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(notes.map(n => n.id));
    }
  };
  
  const handleSelectNote = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };
  
  const handleCreateNote = (ticketId?: string) => {
    setFormData({
      content: '',
      tags: ''
    });
    setNoteModal({ open: true, mode: 'create', ticketId });
  };
  
  const handleEditNote = (note: any) => {
    setFormData({
      content: note.content,
      tags: note.tags.join(', ')
    });
    setNoteModal({ open: true, mode: 'edit', noteId: note.id });
  };
  
  const handleSaveNote = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', noteModal.mode);
    formDataToSubmit.append('content', formData.content);
    formDataToSubmit.append('tags', formData.tags);
    
    if (noteModal.mode === 'create' && noteModal.ticketId) {
      formDataToSubmit.append('ticketId', noteModal.ticketId);
    } else if (noteModal.mode === 'edit' && noteModal.noteId) {
      formDataToSubmit.append('noteId', noteModal.noteId);
    }
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
    setNoteModal({ open: false, mode: 'create' });
  };
  
  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this internal note?')) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'delete');
      formDataToSubmit.append('noteId', noteId);
      fetcher.submit(formDataToSubmit, { method: 'post' });
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'WAITING': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Internal Notes</h1>
          <p className="text-gray-600">Collaborate with your team using internal notes</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedNotes.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedNotes.length})
            </Button>
          )}
          <Button onClick={() => handleCreateNote()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notes</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last 24 Hours</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.last24Hours}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last 7 Days</p>
              <p className="text-2xl font-bold text-gray-900">{noteStats.last7Days}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Active Authors */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Authors</h3>
        <div className="space-y-3">
          {activeAuthors.map((author, index) => (
            <div key={author.senderId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{author.user?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">{author.user?.email}</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {author._count.id} notes
              </div>
            </div>
          ))}
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
            <label className="text-sm text-gray-600">Author:</label>
            <select
              value={filters.author}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('author', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Authors</option>
              <option value={admin.id}>Me</option>
              {/* Add other authors dynamically */}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search notes..."
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
      
      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Internal Notes Found</h3>
            <p className="text-gray-600">Create your first internal note to get started.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedNotes.length === notes.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({notes.length} notes)
              </span>
            </div>
            
            {notes.map((note) => (
              <Card key={note.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedNotes.includes(note.id)}
                    onChange={() => handleSelectNote(note.id)}
                    className="rounded mt-1"
                  />
                  
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-red-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Internal Note</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Internal
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.ticket.status)}`}>
                        {note.ticket.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(note.ticket.priority)}`}>
                        {note.ticket.priority}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>By {note.sender.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Ticket: {note.ticket.subject}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3 bg-red-50 p-3 rounded border-l-4 border-red-500">
                      {note.content}
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleEditNote(note)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteNote(note.id)}
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
            ))}
          </>
        )}
      </div>
      
      {/* Note Modal */}
      {noteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {noteModal.mode === 'create' ? 'Create Internal Note' : 'Edit Internal Note'}
              </h3>
              <Button
                variant="outline"
                onClick={() => setNoteModal({ open: false, mode: 'create' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                  placeholder="Enter your internal note..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas..."
                />
              </div>
              
              <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Internal Note</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  This note will only be visible to admin users and will not be sent to the customer.
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setNoteModal({ open: false, mode: 'create' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={!formData.content.trim() || fetcher.state === 'submitting'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {fetcher.state === 'submitting' ? 'Saving...' : 'Save Note'}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} notes
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
