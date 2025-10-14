import { redirect } from "@remix-run/node";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  avatar: string | null;
  verified: boolean;
}

export interface AdminSession {
  userId: string;
  role: string;
  isAdmin: boolean;
  permissions: string[];
}

/**
 * Require admin access - throws redirect if not admin
 * Use this in ALL admin route loaders
 */
export async function requireAdmin(request: Request): Promise<AdminUser> {
  const user = await getUser(request);
  
  if (!user) {
    throw redirect("/admin/login");
  }
  
  if (user.role !== 'SUPER_ADMIN') {
    throw redirect("/admin/login?error=access_denied");
  }
  
  return user as AdminUser;
}

/**
 * Get admin session without throwing redirect
 * Use this when you need to check admin status without forcing login
 */
export async function getAdminUser(request: Request): Promise<AdminUser | null> {
  const user = await getUser(request);
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    return null;
  }
  
  return user as AdminUser;
}

/**
 * Check if current user is admin (for conditional rendering)
 */
export async function isAdmin(request: Request): Promise<boolean> {
  const user = await getUser(request);
  return user?.role === 'SUPER_ADMIN';
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  details: string,
  request: Request,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        details,
        ipAddress,
        userAgent,
        resourceType: 'ADMIN_ACTION',
        resourceId: adminId,
        hash: `${adminId}-${action}-${Date.now()}`
      }
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Get admin permissions based on role
 */
export function getAdminPermissions(role: string): string[] {
  const permissions = {
    SUPER_ADMIN: [
      'users.manage',
      'users.view',
      'users.delete',
      'providers.approve',
      'providers.reject',
      'providers.suspend',
      'services.approve',
      'services.reject',
      'services.moderate',
      'bookings.manage',
      'bookings.view',
      'bookings.cancel',
      'support.manage',
      'support.assign',
      'reports.view',
      'reports.export',
      'settings.manage',
      'audit.view',
      'content.moderate',
      'financial.manage'
    ],
    ADMIN: [
      'users.view',
      'providers.approve',
      'services.approve',
      'bookings.view',
      'support.manage',
      'reports.view',
      'content.moderate'
    ]
  };
  
  return permissions[role as keyof typeof permissions] || [];
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(admin: AdminUser, permission: string): boolean {
  const permissions = getAdminPermissions(admin.role);
  return permissions.includes(permission);
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeSupportTickets: number;
  recentActivity: any[];
}> {
  const [
    totalUsers,
    totalProviders,
    totalBookings,
    totalRevenue,
    pendingApprovals,
    activeSupportTickets,
    recentActivity
  ] = await Promise.all([
    // Total users (excluding admins)
    prisma.user.count({
      where: {
        role: { not: 'SUPER_ADMIN' }
      }
    }),
    
    // Total providers (property owners, vehicle owners, tour guides)
    prisma.user.count({
      where: {
        role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] }
      }
    }),
    
    // Total bookings (using property bookings as example)
    prisma.propertyBooking.count(),
    
    // Total revenue (sum of all booking amounts)
    prisma.propertyBooking.aggregate({
      _sum: { totalPrice: true }
    }).then(result => result._sum.totalPrice || 0),
    
    // Pending approvals (users and services)
    Promise.all([
      prisma.user.count({
        where: {
          role: { in: ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE'] },
          verified: false
        }
      }),
      prisma.property.count({
        where: { approvalStatus: 'PENDING' }
      }),
      prisma.vehicle.count({
        where: { approvalStatus: 'PENDING' }
      }),
      prisma.tour.count({
        where: { approvalStatus: 'PENDING' }
      })
    ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
    
    // Active support tickets (using a generic count for now)
    prisma.user.count({
      where: {
        role: { not: 'SUPER_ADMIN' }
      }
    }),
    
    // Recent activity (last 10 audit log entries)
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { id: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    })
  ]);
  
  return {
    totalUsers,
    totalProviders,
    totalBookings,
    totalRevenue,
    pendingApprovals,
    activeSupportTickets,
    recentActivity
  };
}

/**
 * Get admin navigation menu based on permissions
 */
export function getAdminNavigation(admin: AdminUser) {
  const baseMenu = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: 'Home',
      permission: null
    }
  ];
  
  const menuItems = [
    {
      name: 'Users',
      href: '/admin/users',
      icon: 'Users',
      permission: 'users.view',
      children: [
        { name: 'All Users', href: '/admin/users' },
        { name: 'Providers', href: '/admin/users/providers' },
        { name: 'Customers', href: '/admin/users/customers' }
      ]
    },
    {
      name: 'Approvals',
      href: '/admin/approvals',
      icon: 'CheckCircle',
      permission: 'providers.approve',
      children: [
        { name: 'Provider Applications', href: '/admin/approvals/providers' },
        { name: 'Service Listings', href: '/admin/approvals/services' }
      ]
    },
    {
      name: 'Bookings',
      href: '/admin/bookings',
      icon: 'Calendar',
      permission: 'bookings.view'
    },
    {
      name: 'Support',
      href: '/admin/support',
      icon: 'MessageSquare',
      permission: 'support.manage'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: 'BarChart',
      permission: 'reports.view',
      children: [
        { name: 'Financial Reports', href: '/admin/reports/financial' },
        { name: 'User Analytics', href: '/admin/reports/users' },
        { name: 'Booking Analytics', href: '/admin/reports/bookings' }
      ]
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: 'Settings',
      permission: 'settings.manage'
    },
    {
      name: 'Audit Logs',
      href: '/admin/audit',
      icon: 'FileText',
      permission: 'audit.view'
    }
  ];
  
  // Filter menu based on permissions
  const filteredMenu = menuItems.filter(item => 
    !item.permission || hasPermission(admin, item.permission)
  );
  
  return [...baseMenu, ...filteredMenu];
}

/**
 * Rate limiting for admin actions
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxAttempts: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxAttempts) {
    return false;
  }
  
  current.count++;
  return true;
}
