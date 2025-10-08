import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useFetcher } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  MessageSquare,
  TrendingUp
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const templates = await prisma.responseTemplate.findMany({
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      usageCount: "desc",
    },
  });

  return json({ templates });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPER_ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "createTemplate") {
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;

    if (!name || !title || !content || !category) {
      return json({ error: "All fields are required" }, { status: 400 });
    }

    const template = await prisma.responseTemplate.create({
      data: {
        name,
        title,
        content,
        category: category as any,
        createdById: userId,
      },
    });

    return json({ success: true, template });
  }

  if (intent === "updateTemplate") {
    const templateId = formData.get("templateId") as string;
    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as string;
    const isActive = formData.get("isActive") === "on";

    if (!templateId || !name || !title || !content || !category) {
      return json({ error: "All fields are required" }, { status: 400 });
    }

    const template = await prisma.responseTemplate.update({
      where: { id: templateId },
      data: {
        name,
        title,
        content,
        category: category as any,
        isActive,
      },
    });

    return json({ success: true, template });
  }

  if (intent === "deleteTemplate") {
    const templateId = formData.get("templateId") as string;

    if (!templateId) {
      return json({ error: "Template ID is required" }, { status: 400 });
    }

    await prisma.responseTemplate.delete({
      where: { id: templateId },
    });

    return json({ success: true });
  }

  if (intent === "duplicateTemplate") {
    const templateId = formData.get("templateId") as string;

    if (!templateId) {
      return json({ error: "Template ID is required" }, { status: 400 });
    }

    const originalTemplate = await prisma.responseTemplate.findUnique({
      where: { id: templateId },
    });

    if (!originalTemplate) {
      return json({ error: "Template not found" }, { status: 404 });
    }

    const template = await prisma.responseTemplate.create({
      data: {
        name: `${originalTemplate.name} (Copy)`,
        title: originalTemplate.title,
        content: originalTemplate.content,
        category: originalTemplate.category,
        createdById: userId,
      },
    });

    return json({ success: true, template });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminTemplates() {
  const { templates } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    content: "",
    category: "TECHNICAL_SUPPORT",
  });

  const handleCreateTemplate = () => {
    setFormData({
      name: "",
      title: "",
      content: "",
      category: "TECHNICAL_SUPPORT",
    });
    setEditingTemplate(null);
    setIsCreating(true);
  };

  const handleEditTemplate = (template: any) => {
    setFormData({
      name: template.name,
      title: template.title,
      content: template.content,
      category: template.category,
    });
    setEditingTemplate(template);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is handled by Remix
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "ACCOUNT_ISSUES": return "bg-blue-100 text-blue-800";
      case "APPROVAL_QUESTIONS": return "bg-green-100 text-green-800";
      case "TECHNICAL_SUPPORT": return "bg-purple-100 text-purple-800";
      case "PAYMENT_ISSUES": return "bg-orange-100 text-orange-800";
      case "POLICY_QUESTIONS": return "bg-gray-100 text-gray-800";
      case "FEATURE_REQUEST": return "bg-pink-100 text-pink-800";
      case "BUG_REPORT": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Response Templates</h1>
              <p className="text-gray-600 mt-2">Manage quick response templates for support</p>
            </div>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{template.title}</p>
                  </div>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {template.content}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Used {template.usageCount} times</span>
                  <span>Created by {template.createdBy.name}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="duplicateTemplate" />
                    <input type="hidden" name="templateId" value={template.id} />
                    <Button variant="outline" size="sm" type="submit">
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                  </Form>
                  
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="deleteTemplate" />
                    <input type="hidden" name="templateId" value={template.id} />
                    <Button variant="outline" size="sm" type="submit" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </Form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create/Edit Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>
                  {editingTemplate ? "Edit Template" : "Create New Template"}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Form method="post" onSubmit={handleSubmit}>
                  {editingTemplate && (
                    <input type="hidden" name="templateId" value={editingTemplate.id} />
                  )}
                  <input 
                    type="hidden" 
                    name="intent" 
                    value={editingTemplate ? "updateTemplate" : "createTemplate"} 
                  />

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Template Name</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Property Approval Instructions"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Property Approval Process"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="ACCOUNT_ISSUES">Account Issues</option>
                        <option value="APPROVAL_QUESTIONS">Approval Questions</option>
                        <option value="TECHNICAL_SUPPORT">Technical Support</option>
                        <option value="PAYMENT_ISSUES">Payment Issues</option>
                        <option value="POLICY_QUESTIONS">Policy Questions</option>
                        <option value="FEATURE_REQUEST">Feature Request</option>
                        <option value="BUG_REPORT">Bug Report</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Content</label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md"
                        rows={8}
                        placeholder="Enter the template content. You can use variables like {{providerName}}, {{serviceName}}, etc."
                        required
                      />
                    </div>

                    {editingTemplate && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          id="isActive"
                          defaultChecked={editingTemplate.isActive}
                        />
                        <label htmlFor="isActive" className="text-sm">
                          Template is active
                        </label>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreating(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingTemplate ? "Update Template" : "Create Template"}
                      </Button>
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success/Error Messages */}
        {actionData?.success && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Template {editingTemplate ? "updated" : "created"} successfully!
          </div>
        )}

        {actionData?.error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {actionData.error}
          </div>
        )}
      </div>
    </div>
  );
}
