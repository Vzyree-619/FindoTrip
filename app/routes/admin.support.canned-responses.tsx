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
  MoreHorizontal,
  Users,
  Calendar,
  AlertTriangle,
  Archive,
  Trash2,
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
  ThumbsDown
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || 'all';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  // Build where clause for canned responses
  const whereClause: any = {};
  
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } }
    ];
  }
  
  if (category !== 'all') {
    whereClause.category = category;
  }
  
  // Get canned responses with pagination
  const [responses, totalCount] = await Promise.all([
    prisma.cannedResponse.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            usageCount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.cannedResponse.count({ where: whereClause })
  ]);
  
  // Get category statistics
  const categoryStats = await Promise.all([
    prisma.cannedResponse.count({ where: { category: 'GENERAL' } }),
    prisma.cannedResponse.count({ where: { category: 'TECHNICAL' } }),
    prisma.cannedResponse.count({ where: { category: 'BILLING' } }),
    prisma.cannedResponse.count({ where: { category: 'BOOKING' } }),
    prisma.cannedResponse.count({ where: { category: 'ACCOUNT' } }),
    prisma.cannedResponse.count({ where: { category: 'ESCALATION' } })
  ]);
  
  // Get most used responses
  const mostUsed = await prisma.cannedResponse.findMany({
    orderBy: { usageCount: 'desc' },
    take: 5,
    include: {
      createdBy: {
        select: {
          name: true
        }
      }
    }
  });
  
  return json({
    admin,
    responses,
    totalCount,
    categoryStats: {
      general: categoryStats[0],
      technical: categoryStats[1],
      billing: categoryStats[2],
      booking: categoryStats[3],
      account: categoryStats[4],
      escalation: categoryStats[5]
    },
    mostUsed,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1
    },
    filters: { search, category }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const responseId = formData.get('responseId') as string;
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const category = formData.get('category') as string;
  const tags = formData.get('tags') as string;
  const isActive = formData.get('isActive') === 'true';
  
  try {
    if (action === 'create') {
      const newResponse = await prisma.cannedResponse.create({
        data: {
          title,
          content,
          category,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          isActive,
          createdBy: admin.id
        }
      });
      
      await logAdminAction(admin.id, 'CREATE_CANNED_RESPONSE', `Created canned response: ${title}`, request);
      return json({ success: true, response: newResponse });
      
    } else if (action === 'update') {
      await prisma.cannedResponse.update({
        where: { id: responseId },
        data: {
          title,
          content,
          category,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          isActive
        }
      });
      
      await logAdminAction(admin.id, 'UPDATE_CANNED_RESPONSE', `Updated canned response: ${title}`, request);
      return json({ success: true });
      
    } else if (action === 'delete') {
      await prisma.cannedResponse.delete({
        where: { id: responseId }
      });
      
      await logAdminAction(admin.id, 'DELETE_CANNED_RESPONSE', `Deleted canned response: ${responseId}`, request);
      return json({ success: true });
      
    } else if (action === 'duplicate') {
      const originalResponse = await prisma.cannedResponse.findUnique({
        where: { id: responseId }
      });
      
      if (originalResponse) {
        await prisma.cannedResponse.create({
          data: {
            title: `${originalResponse.title} (Copy)`,
            content: originalResponse.content,
            category: originalResponse.category,
            tags: originalResponse.tags,
            isActive: false,
            createdBy: admin.id
          }
        });
        
        await logAdminAction(admin.id, 'DUPLICATE_CANNED_RESPONSE', `Duplicated canned response: ${originalResponse.title}`, request);
      }
      
      return json({ success: true });
      
    } else if (action === 'use') {
      // Increment usage count
      await prisma.cannedResponse.update({
        where: { id: responseId },
        data: {
          usageCount: { increment: 1 }
        }
      });
      
      return json({ success: true });
    }
    
    return json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Canned response action error:', error);
    return json({ success: false, error: 'Failed to process action' }, { status: 500 });
  }
}

export default function CannedResponses() {
  const { admin, responses, totalCount, categoryStats, mostUsed, pagination, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [responseModal, setResponseModal] = useState<{ open: boolean; mode: 'create' | 'edit'; responseId?: string }>({
    open: false,
    mode: 'create'
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    tags: '',
    isActive: true
  });
  
  const fetcher = useFetcher();
  
  const handleSelectAll = () => {
    if (selectedResponses.length === responses.length) {
      setSelectedResponses([]);
    } else {
      setSelectedResponses(responses.map(r => r.id));
    }
  };
  
  const handleSelectResponse = (responseId: string) => {
    setSelectedResponses(prev => 
      prev.includes(responseId) 
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };
  
  const handleCreateResponse = () => {
    setFormData({
      title: '',
      content: '',
      category: 'GENERAL',
      tags: '',
      isActive: true
    });
    setResponseModal({ open: true, mode: 'create' });
  };
  
  const handleEditResponse = (response: any) => {
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category,
      tags: response.tags.join(', '),
      isActive: response.isActive
    });
    setResponseModal({ open: true, mode: 'edit', responseId: response.id });
  };
  
  const handleSaveResponse = () => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', responseModal.mode);
    formDataToSubmit.append('title', formData.title);
    formDataToSubmit.append('content', formData.content);
    formDataToSubmit.append('category', formData.category);
    formDataToSubmit.append('tags', formData.tags);
    formDataToSubmit.append('isActive', formData.isActive.toString());
    
    if (responseModal.mode === 'edit' && responseModal.responseId) {
      formDataToSubmit.append('responseId', responseModal.responseId);
    }
    
    fetcher.submit(formDataToSubmit, { method: 'post' });
    setResponseModal({ open: false, mode: 'create' });
  };
  
  const handleDeleteResponse = (responseId: string) => {
    if (confirm('Are you sure you want to delete this canned response?')) {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('action', 'delete');
      formDataToSubmit.append('responseId', responseId);
      fetcher.submit(formDataToSubmit, { method: 'post' });
    }
  };
  
  const handleDuplicateResponse = (responseId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'duplicate');
    formDataToSubmit.append('responseId', responseId);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const handleUseResponse = (responseId: string) => {
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('action', 'use');
    formDataToSubmit.append('responseId', responseId);
    fetcher.submit(formDataToSubmit, { method: 'post' });
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GENERAL': return MessageSquare;
      case 'TECHNICAL': return Wrench;
      case 'BILLING': return Star;
      case 'BOOKING': return Calendar;
      case 'ACCOUNT': return User;
      case 'ESCALATION': return AlertTriangle;
      default: return MessageSquare;
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'GENERAL': return 'bg-blue-100 text-blue-800';
      case 'TECHNICAL': return 'bg-orange-100 text-orange-800';
      case 'BILLING': return 'bg-green-100 text-green-800';
      case 'BOOKING': return 'bg-purple-100 text-purple-800';
      case 'ACCOUNT': return 'bg-yellow-100 text-yellow-800';
      case 'ESCALATION': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canned Responses</h1>
          <p className="text-gray-600">Manage pre-written templates for common support responses</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedResponses.length > 0 && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedResponses.length})
            </Button>
          )}
          <Button onClick={handleCreateResponse} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Response
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">General</p>
              <p className="text-2xl font-bold text-gray-900">{categoryStats.general}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Technical</p>
              <p className="text-2xl font-bold text-gray-900">{categoryStats.technical}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Billing</p>
              <p className="text-2xl font-bold text-gray-900">{categoryStats.billing}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Booking</p>
              <p className="text-2xl font-bold text-gray-900">{categoryStats.booking}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Account</p>
              <p className="text-2xl font-bold text-gray-900">{categoryStats.account}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Escalation</p>
              <p className="text-2xl font-bold text-gray-900">{categoryStats.escalation}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Most Used Responses */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Responses</h3>
        <div className="space-y-3">
          {mostUsed.map((response, index) => (
            <div key={response.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <div>
                  <div className="font-medium text-gray-900">{response.title}</div>
                  <div className="text-sm text-gray-600">{response.category} • Used {response.usageCount} times</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleUseResponse(response.id)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Use
                </Button>
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
            <label className="text-sm text-gray-600">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('category', e.target.value);
                setSearchParams(newParams);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              <option value="GENERAL">General ({categoryStats.general})</option>
              <option value="TECHNICAL">Technical ({categoryStats.technical})</option>
              <option value="BILLING">Billing ({categoryStats.billing})</option>
              <option value="BOOKING">Booking ({categoryStats.booking})</option>
              <option value="ACCOUNT">Account ({categoryStats.account})</option>
              <option value="ESCALATION">Escalation ({categoryStats.escalation})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search responses..."
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
      
      {/* Responses List */}
      <div className="space-y-4">
        {responses.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Canned Responses Found</h3>
            <p className="text-gray-600">Create your first canned response to get started.</p>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedResponses.length === responses.length}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({responses.length} responses)
              </span>
            </div>
            
            {responses.map((response) => {
              const CategoryIcon = getCategoryIcon(response.category);
              
              return (
                <Card key={response.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedResponses.includes(response.id)}
                      onChange={() => handleSelectResponse(response.id)}
                      className="rounded"
                    />
                    
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CategoryIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{response.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(response.category)}`}>
                          {response.category}
                        </span>
                        {response.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Created by {response.createdBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Used {response.usageCount} times</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(response.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-3 line-clamp-3">
                        {response.content}
                      </div>
                      
                      {response.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-gray-500" />
                          <div className="flex flex-wrap gap-1">
                            {response.tags.map((tag, index) => (
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
                        onClick={() => handleUseResponse(response.id)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Use
                      </Button>
                      
                      <Button
                        onClick={() => handleEditResponse(response)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        onClick={() => handleDuplicateResponse(response.id)}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteResponse(response.id)}
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
      
      {/* Response Modal */}
      {responseModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {responseModal.mode === 'create' ? 'Create New Response' : 'Edit Response'}
              </h3>
              <Button
                variant="outline"
                onClick={() => setResponseModal({ open: false, mode: 'create' })}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter response title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GENERAL">General</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BILLING">Billing</option>
                  <option value="BOOKING">Booking</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="ESCALATION">Escalation</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                  placeholder="Enter response content..."
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
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Active (available for use)</label>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setResponseModal({ open: false, mode: 'create' })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveResponse}
                  disabled={!formData.title.trim() || !formData.content.trim() || fetcher.state === 'submitting'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {fetcher.state === 'submitting' ? 'Saving...' : 'Save Response'}
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
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} responses
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
