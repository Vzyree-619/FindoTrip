import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff, 
  Eye,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";
  const status = url.searchParams.get("status") || "";

  // Build where clause
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  const [users, totalUsers, activeUsers, pendingUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        lastLogin: true,
        avatar: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.user.count({ where: { active: false } })
  ]);

  return json({ 
    user, 
    users, 
    stats: { totalUsers, activeUsers, pendingUsers },
    filters: { search, role, status }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const userId = formData.get("userId") as string;

  if (!userId) {
    return json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    switch (intent) {
      case "toggle-status":
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { active: true }
        });

        if (!currentUser) {
          return json({ error: "User not found" }, { status: 404 });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { active: !currentUser.active }
        });

        return json({ success: true, message: `User ${currentUser.active ? 'deactivated' : 'activated'} successfully` });

      case "delete-user":
        // Check if user has any bookings or content
        const userContent = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!userContent) {
          return json({ error: "User not found" }, { status: 404 });
        }

        await prisma.user.delete({
          where: { id: userId }
        });

        return json({ success: true, message: "User deleted successfully" });

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("User management error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
}

export default function UserManagement() {
  const { user, users, stats, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "CUSTOMER": return "bg-blue-100 text-blue-800";
      case "PROPERTY_OWNER": return "bg-green-100 text-green-800";
      case "VEHICLE_OWNER": return "bg-purple-100 text-purple-800";
      case "TOUR_GUIDE": return "bg-orange-100 text-orange-800";
      case "SUPER_ADMIN": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (active: boolean) => {
    return active ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-[#01502E]" />
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>
          <p className="text-gray-600">Manage all users on the platform</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Form method="get" className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search users..."
                    defaultValue={filters.search}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                name="role"
                defaultValue={filters.role}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="PROPERTY_OWNER">Property Owners</option>
                <option value="VEHICLE_OWNER">Vehicle Owners</option>
                <option value="TOUR_GUIDE">Tour Guides</option>
                <option value="SUPER_ADMIN">Super Admins</option>
              </select>

              <select
                name="status"
                defaultValue={filters.status}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#01502E] focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <Button type="submit" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </Form>
          </CardContent>
        </Card>

        {/* Action Messages */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {actionData.message}
          </div>
        )}

        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {actionData.error}
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Bookings</th>
                    <th className="text-left py-3 px-4">Joined</th>
                    <th className="text-left py-3 px-4">Last Login</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 bg-[#01502E] text-white rounded-full flex items-center justify-center">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.active)}
                          <span className={user.active ? "text-green-600" : "text-red-600"}>
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">-</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Form method="post" className="inline">
                            <input type="hidden" name="intent" value="toggle-status" />
                            <input type="hidden" name="userId" value={user.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className={user.active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                            >
                              {user.active ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            </Button>
                          </Form>
                          
                          <Link to={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
