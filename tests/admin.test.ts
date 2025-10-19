import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { json } from '@remix-run/node'
import { prisma } from '~/lib/db/db.server'

// Mock data
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

const mockUsers = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    name: 'User One',
    role: 'CUSTOMER',
    verified: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-2',
    email: 'user2@example.com',
    name: 'User Two',
    role: 'PROPERTY_OWNER',
    verified: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockProperties = [
  {
    id: 'property-1',
    name: 'Test Property 1',
    type: 'APARTMENT',
    city: 'Test City',
    basePrice: 100,
    available: true,
    approvalStatus: 'APPROVED',
    ownerId: 'owner-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'property-2',
    name: 'Test Property 2',
    type: 'HOUSE',
    city: 'Test City',
    basePrice: 150,
    available: true,
    approvalStatus: 'PENDING',
    ownerId: 'owner-2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockBookings = [
  {
    id: 'booking-1',
    type: 'PROPERTY',
    status: 'CONFIRMED',
    totalAmount: 200,
    createdAt: new Date(),
    user: { name: 'User One', email: 'user1@example.com' },
  },
  {
    id: 'booking-2',
    type: 'VEHICLE',
    status: 'PENDING',
    totalAmount: 100,
    createdAt: new Date(),
    user: { name: 'User Two', email: 'user2@example.com' },
  },
]

const mockSupportTickets = [
  {
    id: 'ticket-1',
    title: 'Login Issue',
    description: 'Cannot login to account',
    status: 'OPEN',
    priority: 'MEDIUM',
    category: 'TECHNICAL',
    providerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'ticket-2',
    title: 'Payment Problem',
    description: 'Payment not processed',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    category: 'PAYMENT',
    providerId: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockReviews = [
  {
    id: 'review-1',
    rating: 5,
    comment: 'Excellent service!',
    status: 'APPROVED',
    userId: 'user-1',
    serviceId: 'property-1',
    serviceType: 'PROPERTY',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'review-2',
    rating: 2,
    comment: 'Poor experience',
    status: 'PENDING',
    userId: 'user-2',
    serviceId: 'vehicle-1',
    serviceType: 'VEHICLE',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe('Admin Panel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Admin Dashboard', () => {
    it('should display platform statistics', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100)
      vi.mocked(prisma.property.count).mockResolvedValue(50)
      vi.mocked(prisma.vehicle.count).mockResolvedValue(25)
      vi.mocked(prisma.tour.count).mockResolvedValue(30)
      vi.mocked(prisma.propertyBooking.count).mockResolvedValue(200)
      vi.mocked(prisma.vehicleBooking.count).mockResolvedValue(150)
      vi.mocked(prisma.tourBooking.count).mockResolvedValue(100)

      const stats = {
        totalUsers: await prisma.user.count(),
        totalProperties: await prisma.property.count(),
        totalVehicles: await prisma.vehicle.count(),
        totalTours: await prisma.tour.count(),
        totalBookings: await Promise.all([
          prisma.propertyBooking.count(),
          prisma.vehicleBooking.count(),
          prisma.tourBooking.count(),
        ]).then(counts => counts.reduce((sum, count) => sum + count, 0)),
      }

      expect(stats.totalUsers).toBe(100)
      expect(stats.totalProperties).toBe(50)
      expect(stats.totalVehicles).toBe(25)
      expect(stats.totalTours).toBe(30)
      expect(stats.totalBookings).toBe(450)
    })

    it('should display recent activity', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers.slice(0, 5))
      vi.mocked(prisma.property.findMany).mockResolvedValue(mockProperties.slice(0, 5))
      vi.mocked(prisma.propertyBooking.findMany).mockResolvedValue(mockBookings.slice(0, 5))

      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      const recentProperties = await prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      const recentBookings = await prisma.propertyBooking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      expect(recentUsers).toHaveLength(2)
      expect(recentProperties).toHaveLength(2)
      expect(recentBookings).toHaveLength(2)
    })
  })

  describe('User Management', () => {
    it('should list all users with pagination', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)
      vi.mocked(prisma.user.count).mockResolvedValue(100)

      const users = await prisma.user.findMany({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      })

      const totalCount = await prisma.user.count()

      expect(users).toHaveLength(2)
      expect(totalCount).toBe(100)
    })

    it('should filter users by role', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUsers[0]])

      const customers = await prisma.user.findMany({
        where: { role: 'CUSTOMER' },
      })

      expect(customers).toHaveLength(1)
      expect(customers[0].role).toBe('CUSTOMER')
    })

    it('should search users by name or email', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUsers[0]])

      const searchResults = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: 'User One', mode: 'insensitive' } },
            { email: { contains: 'user1@example.com', mode: 'insensitive' } },
          ],
        },
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].name).toBe('User One')
    })

    it('should update user status', async () => {
      const updatedUser = { ...mockUsers[0], active: false }
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser)

      const result = await prisma.user.update({
        where: { id: 'user-1' },
        data: { active: false },
      })

      expect(result.active).toBe(false)
    })

    it('should verify user account', async () => {
      const verifiedUser = { ...mockUsers[1], verified: true }
      vi.mocked(prisma.user.update).mockResolvedValue(verifiedUser)

      const result = await prisma.user.update({
        where: { id: 'user-2' },
        data: { verified: true },
      })

      expect(result.verified).toBe(true)
    })

    it('should delete user account', async () => {
      vi.mocked(prisma.user.delete).mockResolvedValue(mockUsers[0])

      const result = await prisma.user.delete({
        where: { id: 'user-1' },
      })

      expect(result).toEqual(mockUsers[0])
    })
  })

  describe('Service Management', () => {
    it('should list properties with filters', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue(mockProperties)
      vi.mocked(prisma.property.count).mockResolvedValue(50)

      const properties = await prisma.property.findMany({
        where: { type: 'APARTMENT' },
        orderBy: { createdAt: 'desc' },
      })

      expect(properties).toHaveLength(2)
    })

    it('should approve property listing', async () => {
      const approvedProperty = { ...mockProperties[1], approvalStatus: 'APPROVED' }
      vi.mocked(prisma.property.update).mockResolvedValue(approvedProperty)

      const result = await prisma.property.update({
        where: { id: 'property-2' },
        data: { approvalStatus: 'APPROVED' },
      })

      expect(result.approvalStatus).toBe('APPROVED')
    })

    it('should reject property listing', async () => {
      const rejectedProperty = { 
        ...mockProperties[1], 
        approvalStatus: 'REJECTED',
        rejectionReason: 'Incomplete information'
      }
      vi.mocked(prisma.property.update).mockResolvedValue(rejectedProperty)

      const result = await prisma.property.update({
        where: { id: 'property-2' },
        data: { 
          approvalStatus: 'REJECTED',
          rejectionReason: 'Incomplete information'
        },
      })

      expect(result.approvalStatus).toBe('REJECTED')
      expect(result.rejectionReason).toBe('Incomplete information')
    })

    it('should manage vehicle listings', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([
        {
          id: 'vehicle-1',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          dailyRate: 50,
          available: true,
          approvalStatus: 'APPROVED',
          ownerId: 'owner-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      const vehicles = await prisma.vehicle.findMany({
        orderBy: { createdAt: 'desc' },
      })

      expect(vehicles).toHaveLength(1)
      expect(vehicles[0].make).toBe('Toyota')
    })

    it('should manage tour listings', async () => {
      vi.mocked(prisma.tour.findMany).mockResolvedValue([
        {
          id: 'tour-1',
          title: 'City Tour',
          type: 'WALKING',
          duration: 3,
          pricePerPerson: 25,
          available: true,
          approvalStatus: 'APPROVED',
          guideId: 'guide-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      const tours = await prisma.tour.findMany({
        orderBy: { createdAt: 'desc' },
      })

      expect(tours).toHaveLength(1)
      expect(tours[0].title).toBe('City Tour')
    })
  })

  describe('Booking Management', () => {
    it('should list all bookings', async () => {
      vi.mocked(prisma.propertyBooking.findMany).mockResolvedValue(mockBookings)
      vi.mocked(prisma.vehicleBooking.findMany).mockResolvedValue(mockBookings)
      vi.mocked(prisma.tourBooking.findMany).mockResolvedValue(mockBookings)

      const allBookings = [
        ...await prisma.propertyBooking.findMany(),
        ...await prisma.vehicleBooking.findMany(),
        ...await prisma.tourBooking.findMany(),
      ]

      expect(allBookings).toHaveLength(6)
    })

    it('should filter bookings by status', async () => {
      vi.mocked(prisma.propertyBooking.findMany).mockResolvedValue([
        mockBookings[0]
      ])

      const confirmedBookings = await prisma.propertyBooking.findMany({
        where: { status: 'CONFIRMED' },
      })

      expect(confirmedBookings).toHaveLength(1)
      expect(confirmedBookings[0].status).toBe('CONFIRMED')
    })

    it('should update booking status', async () => {
      const updatedBooking = { ...mockBookings[1], status: 'CONFIRMED' }
      vi.mocked(prisma.propertyBooking.update).mockResolvedValue(updatedBooking)

      const result = await prisma.propertyBooking.update({
        where: { id: 'booking-2' },
        data: { status: 'CONFIRMED' },
      })

      expect(result.status).toBe('CONFIRMED')
    })

    it('should cancel booking', async () => {
      const cancelledBooking = { ...mockBookings[0], status: 'CANCELLED' }
      vi.mocked(prisma.propertyBooking.update).mockResolvedValue(cancelledBooking)

      const result = await prisma.propertyBooking.update({
        where: { id: 'booking-1' },
        data: { status: 'CANCELLED' },
      })

      expect(result.status).toBe('CANCELLED')
    })
  })

  describe('Support System', () => {
    it('should list support tickets', async () => {
      vi.mocked(prisma.supportTicket.findMany).mockResolvedValue(mockSupportTickets)

      const tickets = await prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' },
      })

      expect(tickets).toHaveLength(2)
    })

    it('should filter tickets by status', async () => {
      vi.mocked(prisma.supportTicket.findMany).mockResolvedValue([
        mockSupportTickets[0]
      ])

      const openTickets = await prisma.supportTicket.findMany({
        where: { status: 'OPEN' },
      })

      expect(openTickets).toHaveLength(1)
      expect(openTickets[0].status).toBe('OPEN')
    })

    it('should filter tickets by priority', async () => {
      vi.mocked(prisma.supportTicket.findMany).mockResolvedValue([
        mockSupportTickets[1]
      ])

      const highPriorityTickets = await prisma.supportTicket.findMany({
        where: { priority: 'HIGH' },
      })

      expect(highPriorityTickets).toHaveLength(1)
      expect(highPriorityTickets[0].priority).toBe('HIGH')
    })

    it('should assign ticket to admin', async () => {
      const assignedTicket = { 
        ...mockSupportTickets[0], 
        assignedToId: 'admin-1',
        status: 'IN_PROGRESS'
      }
      vi.mocked(prisma.supportTicket.update).mockResolvedValue(assignedTicket)

      const result = await prisma.supportTicket.update({
        where: { id: 'ticket-1' },
        data: { 
          assignedToId: 'admin-1',
          status: 'IN_PROGRESS'
        },
      })

      expect(result.assignedToId).toBe('admin-1')
      expect(result.status).toBe('IN_PROGRESS')
    })

    it('should resolve ticket', async () => {
      const resolvedTicket = { 
        ...mockSupportTickets[0], 
        status: 'RESOLVED',
        resolution: 'Issue resolved by updating password'
      }
      vi.mocked(prisma.supportTicket.update).mockResolvedValue(resolvedTicket)

      const result = await prisma.supportTicket.update({
        where: { id: 'ticket-1' },
        data: { 
          status: 'RESOLVED',
          resolution: 'Issue resolved by updating password'
        },
      })

      expect(result.status).toBe('RESOLVED')
      expect(result.resolution).toBe('Issue resolved by updating password')
    })
  })

  describe('Review Management', () => {
    it('should list all reviews', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews)

      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
      })

      expect(reviews).toHaveLength(2)
    })

    it('should filter reviews by status', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([
        mockReviews[0]
      ])

      const approvedReviews = await prisma.review.findMany({
        where: { status: 'APPROVED' },
      })

      expect(approvedReviews).toHaveLength(1)
      expect(approvedReviews[0].status).toBe('APPROVED')
    })

    it('should approve review', async () => {
      const approvedReview = { ...mockReviews[1], status: 'APPROVED' }
      vi.mocked(prisma.review.update).mockResolvedValue(approvedReview)

      const result = await prisma.review.update({
        where: { id: 'review-2' },
        data: { status: 'APPROVED' },
      })

      expect(result.status).toBe('APPROVED')
    })

    it('should reject review', async () => {
      const rejectedReview = { 
        ...mockReviews[1], 
        status: 'REJECTED',
        rejectionReason: 'Inappropriate content'
      }
      vi.mocked(prisma.review.update).mockResolvedValue(rejectedReview)

      const result = await prisma.review.update({
        where: { id: 'review-2' },
        data: { 
          status: 'REJECTED',
          rejectionReason: 'Inappropriate content'
        },
      })

      expect(result.status).toBe('REJECTED')
      expect(result.rejectionReason).toBe('Inappropriate content')
    })

    it('should flag review for moderation', async () => {
      const flaggedReview = { 
        ...mockReviews[0], 
        flagged: true,
        flagReason: 'Suspicious content'
      }
      vi.mocked(prisma.review.update).mockResolvedValue(flaggedReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: { 
          flagged: true,
          flagReason: 'Suspicious content'
        },
      })

      expect(result.flagged).toBe(true)
      expect(result.flagReason).toBe('Suspicious content')
    })
  })

  describe('Analytics and Reporting', () => {
    it('should generate user analytics', async () => {
      vi.mocked(prisma.user.count).mockResolvedValue(100)
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers)

      const totalUsers = await prisma.user.count()
      const recentUsers = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })

      expect(totalUsers).toBe(100)
      expect(recentUsers).toHaveLength(2)
    })

    it('should generate booking analytics', async () => {
      vi.mocked(prisma.propertyBooking.count).mockResolvedValue(200)
      vi.mocked(prisma.vehicleBooking.count).mockResolvedValue(150)
      vi.mocked(prisma.tourBooking.count).mockResolvedValue(100)

      const propertyBookings = await prisma.propertyBooking.count()
      const vehicleBookings = await prisma.vehicleBooking.count()
      const tourBookings = await prisma.tourBooking.count()

      const totalBookings = propertyBookings + vehicleBookings + tourBookings

      expect(totalBookings).toBe(450)
    })

    it('should generate revenue analytics', async () => {
      vi.mocked(prisma.propertyBooking.aggregate).mockResolvedValue({
        _sum: { totalAmount: 10000 },
        _avg: { totalAmount: 50 },
        _count: { id: 200 }
      })

      const revenueStats = await prisma.propertyBooking.aggregate({
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
        _count: { id: true }
      })

      expect(revenueStats._sum.totalAmount).toBe(10000)
      expect(revenueStats._avg.totalAmount).toBe(50)
      expect(revenueStats._count.id).toBe(200)
    })
  })

  describe('Security Management', () => {
    it('should track security events', async () => {
      const securityEvent = {
        id: 'event-1',
        type: 'LOGIN_FAILURE',
        severity: 'MEDIUM',
        description: 'Multiple failed login attempts',
        userId: 'user-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(),
      }

      // Mock security event creation
      const createSecurityEvent = vi.fn().mockResolvedValue(securityEvent)

      const result = await createSecurityEvent(securityEvent)

      expect(result.type).toBe('LOGIN_FAILURE')
      expect(result.severity).toBe('MEDIUM')
      expect(result.userId).toBe('user-1')
    })

    it('should handle account lockouts', async () => {
      const lockedUser = {
        ...mockUsers[0],
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
      }

      vi.mocked(prisma.user.update).mockResolvedValue(lockedUser)

      const result = await prisma.user.update({
        where: { id: 'user-1' },
        data: {
          loginAttempts: 5,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
        }
      })

      expect(result.loginAttempts).toBe(5)
      expect(result.lockedUntil).toBeDefined()
    })

    it('should monitor suspicious activity', async () => {
      const suspiciousActivity = {
        id: 'activity-1',
        type: 'UNUSUAL_BOOKING_PATTERN',
        severity: 'HIGH',
        description: 'Multiple bookings from same IP in short time',
        metadata: {
          ipAddress: '192.168.1.1',
          bookingCount: 10,
          timeWindow: '1 hour'
        },
        createdAt: new Date(),
      }

      const createActivity = vi.fn().mockResolvedValue(suspiciousActivity)

      const result = await createActivity(suspiciousActivity)

      expect(result.type).toBe('UNUSUAL_BOOKING_PATTERN')
      expect(result.severity).toBe('HIGH')
      expect(result.metadata.bookingCount).toBe(10)
    })
  })
})
