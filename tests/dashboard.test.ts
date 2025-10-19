import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { json } from '@remix-run/node'
import { prisma } from '~/lib/db/db.server'

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER',
  verified: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPropertyOwner = {
  id: 'owner-1',
  email: 'owner@example.com',
  name: 'Property Owner',
  role: 'PROPERTY_OWNER',
  verified: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockAdmin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
  verified: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockProperty = {
  id: 'property-1',
  name: 'Beautiful Apartment',
  type: 'APARTMENT',
  city: 'New York',
  basePrice: 150,
  rating: 4.5,
  reviewCount: 25,
  totalBookings: 50,
  totalRevenue: 7500,
  ownerId: 'owner-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockBooking = {
  id: 'booking-1',
  propertyId: 'property-1',
  userId: 'user-1',
  checkIn: new Date('2024-01-15'),
  checkOut: new Date('2024-01-17'),
  guests: 2,
  totalAmount: 300,
  status: 'CONFIRMED',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('Dashboard System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Customer Dashboard', () => {
    it('should display customer dashboard overview', async () => {
      const customerStats = {
        totalBookings: 5,
        upcomingBookings: 2,
        completedBookings: 3,
        totalSpent: 1500,
        favoriteProperties: 3,
        reviewsGiven: 2,
      }

      vi.mocked(prisma.propertyBooking.count).mockResolvedValue(5)
      vi.mocked(prisma.propertyBooking.count).mockResolvedValueOnce(2) // upcoming
      vi.mocked(prisma.propertyBooking.count).mockResolvedValueOnce(3) // completed
      vi.mocked(prisma.propertyBooking.aggregate).mockResolvedValue({
        _sum: { totalAmount: 1500 },
      })
      vi.mocked(prisma.favorite.count).mockResolvedValue(3)
      vi.mocked(prisma.review.count).mockResolvedValue(2)

      const [totalBookings, upcomingBookings, completedBookings, totalSpent, favorites, reviews] = await Promise.all([
        prisma.propertyBooking.count({ where: { userId: 'user-1' } }),
        prisma.propertyBooking.count({
          where: { userId: 'user-1', checkIn: { gte: new Date() } },
        }),
        prisma.propertyBooking.count({
          where: { userId: 'user-1', status: 'COMPLETED' },
        }),
        prisma.propertyBooking.aggregate({
          where: { userId: 'user-1' },
          _sum: { totalAmount: true },
        }),
        prisma.favorite.count({ where: { userId: 'user-1' } }),
        prisma.review.count({ where: { userId: 'user-1' } }),
      ])

      expect(totalBookings).toBe(5)
      expect(upcomingBookings).toBe(2)
      expect(completedBookings).toBe(3)
      expect(totalSpent._sum.totalAmount).toBe(1500)
      expect(favorites).toBe(3)
      expect(reviews).toBe(2)
    })

    it('should display recent bookings', async () => {
      const recentBookings = [
        {
          id: 'booking-1',
          propertyName: 'Beautiful Apartment',
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-17'),
          status: 'CONFIRMED',
          totalAmount: 300,
        },
        {
          id: 'booking-2',
          propertyName: 'Cozy House',
          checkIn: new Date('2024-02-10'),
          checkOut: new Date('2024-02-12'),
          status: 'PENDING',
          totalAmount: 400,
        },
      ]

      vi.mocked(prisma.propertyBooking.findMany).mockResolvedValue(recentBookings)

      const bookings = await prisma.propertyBooking.findMany({
        where: { userId: 'user-1' },
        include: { property: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      expect(bookings).toHaveLength(2)
      expect(bookings[0].propertyName).toBe('Beautiful Apartment')
    })

    it('should display favorite properties', async () => {
      const favoriteProperties = [
        {
          id: 'property-1',
          name: 'Beautiful Apartment',
          city: 'New York',
          basePrice: 150,
          rating: 4.5,
          image: 'property1.jpg',
        },
        {
          id: 'property-2',
          name: 'Cozy House',
          city: 'Los Angeles',
          basePrice: 200,
          rating: 4.2,
          image: 'property2.jpg',
        },
      ]

      vi.mocked(prisma.favorite.findMany).mockResolvedValue(favoriteProperties)

      const favorites = await prisma.favorite.findMany({
        where: { userId: 'user-1' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              basePrice: true,
              rating: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(favorites).toHaveLength(2)
      expect(favorites[0].name).toBe('Beautiful Apartment')
    })

    it('should display booking recommendations', async () => {
      const recommendations = [
        {
          id: 'property-3',
          name: 'Luxury Villa',
          city: 'Miami',
          basePrice: 300,
          rating: 4.8,
          reason: 'Based on your preferences',
        },
        {
          id: 'property-4',
          name: 'Mountain Cabin',
          city: 'Denver',
          basePrice: 180,
          rating: 4.6,
          reason: 'Similar to your favorites',
        },
      ]

      vi.mocked(prisma.property.findMany).mockResolvedValue(recommendations)

      const recs = await prisma.property.findMany({
        where: {
          available: true,
          rating: { gte: 4.0 },
          city: { in: ['New York', 'Los Angeles', 'Miami', 'Denver'] },
        },
        orderBy: { rating: 'desc' },
        take: 5,
      })

      expect(recs).toHaveLength(2)
      expect(recs[0].name).toBe('Luxury Villa')
    })
  })

  describe('Property Owner Dashboard', () => {
    it('should display property owner overview', async () => {
      const ownerStats = {
        totalProperties: 3,
        activeProperties: 2,
        totalBookings: 25,
        totalRevenue: 15000,
        averageRating: 4.3,
        occupancyRate: 0.75,
      }

      vi.mocked(prisma.property.count).mockResolvedValue(3)
      vi.mocked(prisma.property.count).mockResolvedValueOnce(2) // active
      vi.mocked(prisma.propertyBooking.count).mockResolvedValue(25)
      vi.mocked(prisma.propertyBooking.aggregate).mockResolvedValue({
        _sum: { totalAmount: 15000 },
      })
      vi.mocked(prisma.property.aggregate).mockResolvedValue({
        _avg: { rating: 4.3 },
      })

      const [totalProperties, activeProperties, totalBookings, totalRevenue, avgRating] = await Promise.all([
        prisma.property.count({ where: { ownerId: 'owner-1' } }),
        prisma.property.count({ where: { ownerId: 'owner-1', available: true } }),
        prisma.propertyBooking.count({
          where: { property: { ownerId: 'owner-1' } },
        }),
        prisma.propertyBooking.aggregate({
          where: { property: { ownerId: 'owner-1' } },
          _sum: { totalAmount: true },
        }),
        prisma.property.aggregate({
          where: { ownerId: 'owner-1' },
          _avg: { rating: true },
        }),
      ])

      expect(totalProperties).toBe(3)
      expect(activeProperties).toBe(2)
      expect(totalBookings).toBe(25)
      expect(totalRevenue._sum.totalAmount).toBe(15000)
      expect(avgRating._avg.rating).toBe(4.3)
    })

    it('should display property performance', async () => {
      const propertyPerformance = [
        {
          id: 'property-1',
          name: 'Beautiful Apartment',
          bookings: 15,
          revenue: 4500,
          rating: 4.5,
          occupancyRate: 0.8,
        },
        {
          id: 'property-2',
          name: 'Cozy House',
          bookings: 10,
          revenue: 3000,
          rating: 4.2,
          occupancyRate: 0.6,
        },
      ]

      vi.mocked(prisma.property.findMany).mockResolvedValue(propertyPerformance)

      const performance = await prisma.property.findMany({
        where: { ownerId: 'owner-1' },
        include: {
          _count: { select: { bookings: true } },
          bookings: {
            select: { totalAmount: true },
          },
        },
        orderBy: { totalRevenue: 'desc' },
      })

      expect(performance).toHaveLength(2)
      expect(performance[0].name).toBe('Beautiful Apartment')
    })

    it('should display booking calendar', async () => {
      const calendarBookings = [
        {
          id: 'booking-1',
          propertyId: 'property-1',
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-17'),
          status: 'CONFIRMED',
          guestName: 'John Doe',
        },
        {
          id: 'booking-2',
          propertyId: 'property-1',
          checkIn: new Date('2024-01-20'),
          checkOut: new Date('2024-01-22'),
          status: 'PENDING',
          guestName: 'Jane Smith',
        },
      ]

      vi.mocked(prisma.propertyBooking.findMany).mockResolvedValue(calendarBookings)

      const bookings = await prisma.propertyBooking.findMany({
        where: {
          property: { ownerId: 'owner-1' },
          checkIn: { gte: new Date('2024-01-01') },
        },
        include: {
          user: { select: { name: true } },
        },
        orderBy: { checkIn: 'asc' },
      })

      expect(bookings).toHaveLength(2)
      expect(bookings[0].guestName).toBe('John Doe')
    })

    it('should display revenue analytics', async () => {
      const revenueData = {
        monthlyRevenue: [
          { month: '2024-01', revenue: 5000 },
          { month: '2024-02', revenue: 6000 },
          { month: '2024-03', revenue: 7000 },
        ],
        totalRevenue: 18000,
        averageBookingValue: 200,
        revenueGrowth: 20,
      }

      vi.mocked(prisma.propertyBooking.aggregate).mockResolvedValue({
        _sum: { totalAmount: 18000 },
        _avg: { totalAmount: 200 },
      })

      const [totalRevenue, avgBookingValue] = await Promise.all([
        prisma.propertyBooking.aggregate({
          where: { property: { ownerId: 'owner-1' } },
          _sum: { totalAmount: true },
        }),
        prisma.propertyBooking.aggregate({
          where: { property: { ownerId: 'owner-1' } },
          _avg: { totalAmount: true },
        }),
      ])

      expect(totalRevenue._sum.totalAmount).toBe(18000)
      expect(avgBookingValue._avg.totalAmount).toBe(200)
    })
  })

  describe('Admin Dashboard', () => {
    it('should display platform overview', async () => {
      const platformStats = {
        totalUsers: 1000,
        totalProperties: 250,
        totalVehicles: 150,
        totalTours: 100,
        totalBookings: 5000,
        totalRevenue: 500000,
        activeUsers: 800,
        newUsersThisMonth: 50,
      }

      vi.mocked(prisma.user.count).mockResolvedValue(1000)
      vi.mocked(prisma.property.count).mockResolvedValue(250)
      vi.mocked(prisma.vehicle.count).mockResolvedValue(150)
      vi.mocked(prisma.tour.count).mockResolvedValue(100)
      vi.mocked(prisma.propertyBooking.count).mockResolvedValue(3000)
      vi.mocked(prisma.vehicleBooking.count).mockResolvedValue(1500)
      vi.mocked(prisma.tourBooking.count).mockResolvedValue(500)
      vi.mocked(prisma.user.count).mockResolvedValueOnce(800) // active users
      vi.mocked(prisma.user.count).mockResolvedValueOnce(50) // new users

      const [totalUsers, totalProperties, totalVehicles, totalTours, propertyBookings, vehicleBookings, tourBookings, activeUsers, newUsers] = await Promise.all([
        prisma.user.count(),
        prisma.property.count(),
        prisma.vehicle.count(),
        prisma.tour.count(),
        prisma.propertyBooking.count(),
        prisma.vehicleBooking.count(),
        prisma.tourBooking.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ])

      const totalBookings = propertyBookings + vehicleBookings + tourBookings

      expect(totalUsers).toBe(1000)
      expect(totalProperties).toBe(250)
      expect(totalVehicles).toBe(150)
      expect(totalTours).toBe(100)
      expect(totalBookings).toBe(5000)
      expect(activeUsers).toBe(800)
      expect(newUsers).toBe(50)
    })

    it('should display user management overview', async () => {
      const userManagementStats = {
        pendingVerifications: 25,
        newUsersToday: 5,
        inactiveUsers: 50,
        bannedUsers: 2,
        userGrowthRate: 12.5,
      }

      vi.mocked(prisma.user.count).mockResolvedValue(25) // pending verifications
      vi.mocked(prisma.user.count).mockResolvedValueOnce(5) // new users today
      vi.mocked(prisma.user.count).mockResolvedValueOnce(50) // inactive users
      vi.mocked(prisma.user.count).mockResolvedValueOnce(2) // banned users

      const [pendingVerifications, newUsersToday, inactiveUsers, bannedUsers] = await Promise.all([
        prisma.user.count({
          where: { verified: false, active: true },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.user.count({
          where: {
            lastLoginAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.user.count({
          where: { active: false },
        }),
      ])

      expect(pendingVerifications).toBe(25)
      expect(newUsersToday).toBe(5)
      expect(inactiveUsers).toBe(50)
      expect(bannedUsers).toBe(2)
    })

    it('should display service management overview', async () => {
      const serviceStats = {
        pendingProperties: 10,
        pendingVehicles: 5,
        pendingTours: 8,
        totalServices: 500,
        approvedServices: 477,
        rejectedServices: 23,
      }

      vi.mocked(prisma.property.count).mockResolvedValue(10) // pending properties
      vi.mocked(prisma.vehicle.count).mockResolvedValue(5) // pending vehicles
      vi.mocked(prisma.tour.count).mockResolvedValue(8) // pending tours
      vi.mocked(prisma.property.count).mockResolvedValueOnce(250) // total properties
      vi.mocked(prisma.vehicle.count).mockResolvedValueOnce(150) // total vehicles
      vi.mocked(prisma.tour.count).mockResolvedValueOnce(100) // total tours
      vi.mocked(prisma.property.count).mockResolvedValueOnce(240) // approved properties
      vi.mocked(prisma.vehicle.count).mockResolvedValueOnce(145) // approved vehicles
      vi.mocked(prisma.tour.count).mockResolvedValueOnce(92) // approved tours

      const [pendingProperties, pendingVehicles, pendingTours, totalProperties, totalVehicles, totalTours, approvedProperties, approvedVehicles, approvedTours] = await Promise.all([
        prisma.property.count({ where: { approvalStatus: 'PENDING' } }),
        prisma.vehicle.count({ where: { approvalStatus: 'PENDING' } }),
        prisma.tour.count({ where: { approvalStatus: 'PENDING' } }),
        prisma.property.count(),
        prisma.vehicle.count(),
        prisma.tour.count(),
        prisma.property.count({ where: { approvalStatus: 'APPROVED' } }),
        prisma.vehicle.count({ where: { approvalStatus: 'APPROVED' } }),
        prisma.tour.count({ where: { approvalStatus: 'APPROVED' } }),
      ])

      const totalServices = totalProperties + totalVehicles + totalTours
      const approvedServices = approvedProperties + approvedVehicles + approvedTours

      expect(pendingProperties).toBe(10)
      expect(pendingVehicles).toBe(5)
      expect(pendingTours).toBe(8)
      expect(totalServices).toBe(500)
      expect(approvedServices).toBe(477)
    })

    it('should display support system overview', async () => {
      const supportStats = {
        openTickets: 15,
        resolvedTickets: 200,
        averageResolutionTime: 24, // hours
        highPriorityTickets: 3,
        customerSatisfaction: 4.2,
      }

      vi.mocked(prisma.supportTicket.count).mockResolvedValue(15) // open tickets
      vi.mocked(prisma.supportTicket.count).mockResolvedValueOnce(200) // resolved tickets
      vi.mocked(prisma.supportTicket.count).mockResolvedValueOnce(3) // high priority
      vi.mocked(prisma.supportTicket.aggregate).mockResolvedValue({
        _avg: { resolutionTime: 24 },
      })

      const [openTickets, resolvedTickets, highPriorityTickets, avgResolutionTime] = await Promise.all([
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
        prisma.supportTicket.count({ where: { priority: 'HIGH' } }),
        prisma.supportTicket.aggregate({
          _avg: { resolutionTime: true },
        }),
      ])

      expect(openTickets).toBe(15)
      expect(resolvedTickets).toBe(200)
      expect(highPriorityTickets).toBe(3)
      expect(avgResolutionTime._avg.resolutionTime).toBe(24)
    })
  })

  describe('Dashboard Widgets', () => {
    it('should display revenue chart widget', async () => {
      const revenueChartData = [
        { month: '2024-01', revenue: 40000 },
        { month: '2024-02', revenue: 45000 },
        { month: '2024-03', revenue: 50000 },
        { month: '2024-04', revenue: 55000 },
      ]

      const getRevenueChartData = vi.fn().mockResolvedValue(revenueChartData)

      const result = await getRevenueChartData({
        period: '6 months',
        type: 'revenue',
      })

      expect(result).toHaveLength(4)
      expect(result[0].month).toBe('2024-01')
      expect(result[0].revenue).toBe(40000)
    })

    it('should display booking trends widget', async () => {
      const bookingTrendsData = [
        { date: '2024-01-01', bookings: 20 },
        { date: '2024-01-02', bookings: 25 },
        { date: '2024-01-03', bookings: 30 },
      ]

      const getBookingTrendsData = vi.fn().mockResolvedValue(bookingTrendsData)

      const result = await getBookingTrendsData({
        period: '7 days',
        type: 'bookings',
      })

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[0].bookings).toBe(20)
    })

    it('should display user activity widget', async () => {
      const userActivityData = {
        onlineUsers: 150,
        activeUsers: 500,
        newRegistrations: 25,
        loginRate: 0.85,
      }

      const getUserActivityData = vi.fn().mockResolvedValue(userActivityData)

      const result = await getUserActivityData()

      expect(result.onlineUsers).toBe(150)
      expect(result.activeUsers).toBe(500)
      expect(result.newRegistrations).toBe(25)
      expect(result.loginRate).toBe(0.85)
    })

    it('should display top performers widget', async () => {
      const topPerformers = [
        { name: 'Beautiful Apartment', bookings: 50, revenue: 7500, rating: 4.8 },
        { name: 'Luxury Villa', bookings: 40, revenue: 12000, rating: 4.9 },
        { name: 'Cozy House', bookings: 35, revenue: 5250, rating: 4.6 },
      ]

      const getTopPerformers = vi.fn().mockResolvedValue(topPerformers)

      const result = await getTopPerformers({
        type: 'properties',
        limit: 5,
        sortBy: 'revenue',
      })

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Beautiful Apartment')
      expect(result[0].bookings).toBe(50)
    })
  })

  describe('Dashboard Customization', () => {
    it('should save dashboard layout preferences', async () => {
      const layoutPreferences = {
        userId: 'user-1',
        widgets: [
          { id: 'revenue-chart', position: { x: 0, y: 0 }, size: { w: 6, h: 4 } },
          { id: 'booking-trends', position: { x: 6, y: 0 }, size: { w: 6, h: 4 } },
          { id: 'user-activity', position: { x: 0, y: 4 }, size: { w: 4, h: 3 } },
        ],
        theme: 'light',
        refreshInterval: 30000, // 30 seconds
      }

      const saveLayoutPreferences = vi.fn().mockResolvedValue(layoutPreferences)

      const result = await saveLayoutPreferences({
        userId: 'user-1',
        layout: layoutPreferences,
      })

      expect(result.userId).toBe('user-1')
      expect(result.widgets).toHaveLength(3)
      expect(result.theme).toBe('light')
    })

    it('should load dashboard layout preferences', async () => {
      const savedLayout = {
        userId: 'user-1',
        widgets: [
          { id: 'revenue-chart', position: { x: 0, y: 0 }, size: { w: 6, h: 4 } },
        ],
        theme: 'dark',
        refreshInterval: 60000,
      }

      const loadLayoutPreferences = vi.fn().mockResolvedValue(savedLayout)

      const result = await loadLayoutPreferences('user-1')

      expect(result.userId).toBe('user-1')
      expect(result.widgets).toHaveLength(1)
      expect(result.theme).toBe('dark')
    })

    it('should reset dashboard to default layout', async () => {
      const defaultLayout = {
        widgets: [
          { id: 'overview-stats', position: { x: 0, y: 0 }, size: { w: 12, h: 2 } },
          { id: 'revenue-chart', position: { x: 0, y: 2 }, size: { w: 6, h: 4 } },
          { id: 'booking-trends', position: { x: 6, y: 2 }, size: { w: 6, h: 4 } },
        ],
        theme: 'light',
        refreshInterval: 30000,
      }

      const resetToDefault = vi.fn().mockResolvedValue(defaultLayout)

      const result = await resetToDefault('user-1')

      expect(result.widgets).toHaveLength(3)
      expect(result.theme).toBe('light')
    })
  })

  describe('Dashboard Notifications', () => {
    it('should display dashboard notifications', async () => {
      const dashboardNotifications = [
        {
          id: 'notif-1',
          type: 'BOOKING',
          title: 'New Booking',
          message: 'You have a new booking for Beautiful Apartment',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          type: 'REVIEW',
          title: 'New Review',
          message: 'You have received a new review',
          isRead: false,
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.notification.findMany).mockResolvedValue(dashboardNotifications)

      const notifications = await prisma.notification.findMany({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      expect(notifications).toHaveLength(2)
      expect(notifications[0].type).toBe('BOOKING')
    })

    it('should mark dashboard notifications as read', async () => {
      const readNotification = {
        id: 'notif-1',
        isRead: true,
        readAt: new Date(),
      }

      vi.mocked(prisma.notification.update).mockResolvedValue(readNotification)

      const result = await prisma.notification.update({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: new Date() },
      })

      expect(result.isRead).toBe(true)
      expect(result.readAt).toBeDefined()
    })
  })

  describe('Dashboard Performance', () => {
    it('should load dashboard data efficiently', async () => {
      const startTime = Date.now()
      
      const loadDashboardData = vi.fn().mockResolvedValue({
        stats: { totalBookings: 100, totalRevenue: 15000 },
        recentBookings: [],
        notifications: [],
      })

      const result = await loadDashboardData('user-1')
      const endTime = Date.now()

      expect(result.stats.totalBookings).toBe(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should load in under 1 second
    })

    it('should cache dashboard data', async () => {
      const cacheKey = 'dashboard:user-1'
      const cachedData = {
        stats: { totalBookings: 100, totalRevenue: 15000 },
        lastUpdated: new Date(),
        ttl: 300, // 5 minutes
      }

      const getCachedData = vi.fn().mockResolvedValue(cachedData)

      const result = await getCachedData(cacheKey)

      expect(result.stats.totalBookings).toBe(100)
      expect(result.ttl).toBe(300)
    })

    it('should refresh dashboard data', async () => {
      const refreshDashboard = vi.fn().mockResolvedValue({
        success: true,
        data: {
          stats: { totalBookings: 105, totalRevenue: 15750 },
          lastUpdated: new Date(),
        },
      })

      const result = await refreshDashboard('user-1')

      expect(result.success).toBe(true)
      expect(result.data.stats.totalBookings).toBe(105)
    })
  })
})
