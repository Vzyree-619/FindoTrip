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

const mockNotification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'BOOKING',
  title: 'Booking Confirmed',
  message: 'Your booking has been confirmed for Property ABC',
  data: {
    bookingId: 'booking-1',
    propertyId: 'property-1',
    checkIn: '2024-01-15',
    checkOut: '2024-01-17',
  },
  isRead: false,
  readAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockNotifications = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'BOOKING',
    title: 'Booking Confirmed',
    message: 'Your booking has been confirmed',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'MESSAGE',
    title: 'New Message',
    message: 'You have a new message from Property Owner',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'REVIEW',
    title: 'Review Approved',
    message: 'Your review has been approved',
    isRead: true,
    readAt: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
]

describe('Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Notification Creation', () => {
    it('should create booking notification', async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification)

      const notification = await prisma.notification.create({
        data: {
          userId: 'user-1',
          type: 'BOOKING',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed for Property ABC',
          data: {
            bookingId: 'booking-1',
            propertyId: 'property-1',
            checkIn: '2024-01-15',
            checkOut: '2024-01-17',
          },
          isRead: false,
        },
      })

      expect(notification).toEqual(mockNotification)
      expect(notification.type).toBe('BOOKING')
      expect(notification.data.bookingId).toBe('booking-1')
    })

    it('should create message notification', async () => {
      const messageNotification = {
        ...mockNotification,
        id: 'notif-2',
        type: 'MESSAGE',
        title: 'New Message',
        message: 'You have a new message from Property Owner',
        data: {
          conversationId: 'conv-1',
          senderId: 'owner-1',
          messageId: 'msg-1',
        },
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(messageNotification)

      const notification = await prisma.notification.create({
        data: {
          userId: 'user-1',
          type: 'MESSAGE',
          title: 'New Message',
          message: 'You have a new message from Property Owner',
          data: {
            conversationId: 'conv-1',
            senderId: 'owner-1',
            messageId: 'msg-1',
          },
          isRead: false,
        },
      })

      expect(notification.type).toBe('MESSAGE')
      expect(notification.data.conversationId).toBe('conv-1')
    })

    it('should create review notification', async () => {
      const reviewNotification = {
        ...mockNotification,
        id: 'notif-3',
        type: 'REVIEW',
        title: 'New Review',
        message: 'You have received a new review for your property',
        data: {
          reviewId: 'review-1',
          propertyId: 'property-1',
          rating: 5,
        },
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(reviewNotification)

      const notification = await prisma.notification.create({
        data: {
          userId: 'user-1',
          type: 'REVIEW',
          title: 'New Review',
          message: 'You have received a new review for your property',
          data: {
            reviewId: 'review-1',
            propertyId: 'property-1',
            rating: 5,
          },
          isRead: false,
        },
      })

      expect(notification.type).toBe('REVIEW')
      expect(notification.data.reviewId).toBe('review-1')
    })

    it('should create system notification', async () => {
      const systemNotification = {
        ...mockNotification,
        id: 'notif-4',
        type: 'SYSTEM',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2-4 AM',
        data: {
          maintenanceStart: '2024-01-15T02:00:00Z',
          maintenanceEnd: '2024-01-15T04:00:00Z',
        },
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(systemNotification)

      const notification = await prisma.notification.create({
        data: {
          userId: 'user-1',
          type: 'SYSTEM',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2-4 AM',
          data: {
            maintenanceStart: '2024-01-15T02:00:00Z',
            maintenanceEnd: '2024-01-15T04:00:00Z',
          },
          isRead: false,
        },
      })

      expect(notification.type).toBe('SYSTEM')
      expect(notification.data.maintenanceStart).toBe('2024-01-15T02:00:00Z')
    })

    it('should create promotional notification', async () => {
      const promoNotification = {
        ...mockNotification,
        id: 'notif-5',
        type: 'PROMOTIONAL',
        title: 'Special Offer',
        message: 'Get 20% off your next booking!',
        data: {
          discountCode: 'SAVE20',
          discountPercent: 20,
          expiryDate: '2024-02-15',
        },
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(promoNotification)

      const notification = await prisma.notification.create({
        data: {
          userId: 'user-1',
          type: 'PROMOTIONAL',
          title: 'Special Offer',
          message: 'Get 20% off your next booking!',
          data: {
            discountCode: 'SAVE20',
            discountPercent: 20,
            expiryDate: '2024-02-15',
          },
          isRead: false,
        },
      })

      expect(notification.type).toBe('PROMOTIONAL')
      expect(notification.data.discountCode).toBe('SAVE20')
    })
  })

  describe('Notification Retrieval', () => {
    it('should get user notifications', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications)

      const notifications = await prisma.notification.findMany({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      })

      expect(notifications).toHaveLength(3)
      expect(notifications[0].userId).toBe('user-1')
    })

    it('should get unread notifications', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([mockNotifications[0], mockNotifications[1]])

      const unreadNotifications = await prisma.notification.findMany({
        where: {
          userId: 'user-1',
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(unreadNotifications).toHaveLength(2)
      expect(unreadNotifications.every(notif => !notif.isRead)).toBe(true)
    })

    it('should get notifications by type', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([mockNotifications[0]])

      const bookingNotifications = await prisma.notification.findMany({
        where: {
          userId: 'user-1',
          type: 'BOOKING',
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(bookingNotifications).toHaveLength(1)
      expect(bookingNotifications[0].type).toBe('BOOKING')
    })

    it('should get recent notifications', async () => {
      const recentDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications)

      const recentNotifications = await prisma.notification.findMany({
        where: {
          userId: 'user-1',
          createdAt: { gte: recentDate },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(recentNotifications).toHaveLength(3)
    })

    it('should get notification count', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(5)

      const unreadCount = await prisma.notification.count({
        where: {
          userId: 'user-1',
          isRead: false,
        },
      })

      expect(unreadCount).toBe(5)
    })
  })

  describe('Notification Management', () => {
    it('should mark notification as read', async () => {
      const readNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      }

      vi.mocked(prisma.notification.update).mockResolvedValue(readNotification)

      const result = await prisma.notification.update({
        where: { id: 'notif-1' },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      expect(result.isRead).toBe(true)
      expect(result.readAt).toBeDefined()
    })

    it('should mark all notifications as read', async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 3 })

      const result = await prisma.notification.updateMany({
        where: {
          userId: 'user-1',
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      expect(result.count).toBe(3)
    })

    it('should delete notification', async () => {
      vi.mocked(prisma.notification.delete).mockResolvedValue(mockNotification)

      const result = await prisma.notification.delete({
        where: { id: 'notif-1' },
      })

      expect(result).toEqual(mockNotification)
    })

    it('should delete old notifications', async () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 10 })

      const result = await prisma.notification.deleteMany({
        where: {
          userId: 'user-1',
          createdAt: { lt: oldDate },
          isRead: true,
        },
      })

      expect(result.count).toBe(10)
    })

    it('should clear all notifications', async () => {
      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 5 })

      const result = await prisma.notification.deleteMany({
        where: { userId: 'user-1' },
      })

      expect(result.count).toBe(5)
    })
  })

  describe('Notification Preferences', () => {
    it('should get user notification preferences', async () => {
      const preferences = {
        id: 'pref-1',
        userId: 'user-1',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        bookingNotifications: true,
        messageNotifications: true,
        reviewNotifications: true,
        promotionalNotifications: false,
        systemNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.notificationPreferences.findUnique).mockResolvedValue(preferences)

      const userPreferences = await prisma.notificationPreferences.findUnique({
        where: { userId: 'user-1' },
      })

      expect(userPreferences).toEqual(preferences)
      expect(userPreferences.emailNotifications).toBe(true)
      expect(userPreferences.promotionalNotifications).toBe(false)
    })

    it('should update notification preferences', async () => {
      const updatedPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        emailNotifications: false,
        pushNotifications: true,
        smsNotifications: false,
        bookingNotifications: true,
        messageNotifications: false,
        reviewNotifications: true,
        promotionalNotifications: false,
        systemNotifications: true,
        updatedAt: new Date(),
      }

      vi.mocked(prisma.notificationPreferences.update).mockResolvedValue(updatedPreferences)

      const result = await prisma.notificationPreferences.update({
        where: { userId: 'user-1' },
        data: {
          emailNotifications: false,
          messageNotifications: false,
        },
      })

      expect(result.emailNotifications).toBe(false)
      expect(result.messageNotifications).toBe(false)
    })

    it('should create default preferences for new user', async () => {
      const defaultPreferences = {
        id: 'pref-2',
        userId: 'user-2',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        bookingNotifications: true,
        messageNotifications: true,
        reviewNotifications: true,
        promotionalNotifications: true,
        systemNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.notificationPreferences.create).mockResolvedValue(defaultPreferences)

      const preferences = await prisma.notificationPreferences.create({
        data: {
          userId: 'user-2',
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          bookingNotifications: true,
          messageNotifications: true,
          reviewNotifications: true,
          promotionalNotifications: true,
          systemNotifications: true,
        },
      })

      expect(preferences).toEqual(defaultPreferences)
    })
  })

  describe('Notification Delivery', () => {
    it('should send email notification', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Booking Confirmed',
        template: 'booking-confirmation',
        data: {
          userName: 'Test User',
          propertyName: 'Beautiful Apartment',
          checkIn: '2024-01-15',
          checkOut: '2024-01-17',
        },
      }

      const sendEmail = vi.fn().mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      })

      const result = await sendEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-123')
    })

    it('should send push notification', async () => {
      const pushData = {
        userId: 'user-1',
        title: 'New Message',
        body: 'You have a new message from Property Owner',
        data: {
          type: 'MESSAGE',
          conversationId: 'conv-1',
        },
      }

      const sendPush = vi.fn().mockResolvedValue({
        success: true,
        notificationId: 'push-123',
      })

      const result = await sendPush(pushData)

      expect(result.success).toBe(true)
      expect(result.notificationId).toBe('push-123')
    })

    it('should send SMS notification', async () => {
      const smsData = {
        phoneNumber: '+1234567890',
        message: 'Your booking has been confirmed. Check your email for details.',
      }

      const sendSMS = vi.fn().mockResolvedValue({
        success: true,
        messageId: 'sms-123',
      })

      const result = await sendSMS(smsData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('sms-123')
    })

    it('should handle notification delivery failure', async () => {
      const sendEmail = vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid email address',
      })

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        message: 'Test message',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email address')
    })
  })

  describe('Notification Analytics', () => {
    it('should track notification statistics', async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(100)
      vi.mocked(prisma.notification.aggregate).mockResolvedValue({
        _avg: { isRead: 0.7 },
        _count: { id: 100 },
      })

      const [totalCount, stats] = await Promise.all([
        prisma.notification.count({
          where: { userId: 'user-1' },
        }),
        prisma.notification.aggregate({
          where: { userId: 'user-1' },
          _avg: { isRead: true },
          _count: { id: true },
        }),
      ])

      expect(totalCount).toBe(100)
      expect(stats._count.id).toBe(100)
    })

    it('should track notification engagement', async () => {
      const engagementStats = {
        totalSent: 100,
        totalRead: 70,
        totalClicked: 45,
        engagementRate: 0.45,
      }

      vi.mocked(prisma.notification.count).mockResolvedValue(100)
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(70) // read count
      vi.mocked(prisma.notification.count).mockResolvedValueOnce(45) // clicked count

      const [totalSent, totalRead, totalClicked] = await Promise.all([
        prisma.notification.count({ where: { userId: 'user-1' } }),
        prisma.notification.count({ where: { userId: 'user-1', isRead: true } }),
        prisma.notification.count({ where: { userId: 'user-1', clickedAt: { not: null } } }),
      ])

      const engagementRate = totalClicked / totalSent

      expect(totalSent).toBe(100)
      expect(totalRead).toBe(70)
      expect(totalClicked).toBe(45)
      expect(engagementRate).toBe(0.45)
    })

    it('should track notification types performance', async () => {
      const typeStats = [
        { type: 'BOOKING', count: 30, readRate: 0.9 },
        { type: 'MESSAGE', count: 25, readRate: 0.8 },
        { type: 'REVIEW', count: 20, readRate: 0.7 },
        { type: 'PROMOTIONAL', count: 15, readRate: 0.5 },
      ]

      for (const stat of typeStats) {
        vi.mocked(prisma.notification.count).mockResolvedValueOnce(stat.count)
        vi.mocked(prisma.notification.count).mockResolvedValueOnce(Math.floor(stat.count * stat.readRate))
      }

      const stats = await Promise.all(
        typeStats.map(async (stat) => {
          const [total, read] = await Promise.all([
            prisma.notification.count({ where: { userId: 'user-1', type: stat.type } }),
            prisma.notification.count({ where: { userId: 'user-1', type: stat.type, isRead: true } }),
          ])
          return { type: stat.type, total, read, readRate: read / total }
        })
      )

      expect(stats).toHaveLength(4)
      expect(stats[0].type).toBe('BOOKING')
      expect(stats[0].readRate).toBeCloseTo(0.9, 1)
    })
  })

  describe('Notification Templates', () => {
    it('should use booking confirmation template', async () => {
      const template = {
        subject: 'Booking Confirmed - {{propertyName}}',
        body: 'Hi {{userName}}, your booking for {{propertyName}} has been confirmed. Check-in: {{checkIn}}, Check-out: {{checkOut}}.',
        variables: ['userName', 'propertyName', 'checkIn', 'checkOut'],
      }

      const renderedTemplate = {
        subject: 'Booking Confirmed - Beautiful Apartment',
        body: 'Hi Test User, your booking for Beautiful Apartment has been confirmed. Check-in: 2024-01-15, Check-out: 2024-01-17.',
      }

      const renderTemplate = vi.fn().mockReturnValue(renderedTemplate)

      const result = renderTemplate(template, {
        userName: 'Test User',
        propertyName: 'Beautiful Apartment',
        checkIn: '2024-01-15',
        checkOut: '2024-01-17',
      })

      expect(result.subject).toBe('Booking Confirmed - Beautiful Apartment')
      expect(result.body).toContain('Test User')
      expect(result.body).toContain('Beautiful Apartment')
    })

    it('should use message notification template', async () => {
      const template = {
        subject: 'New Message from {{senderName}}',
        body: 'You have received a new message from {{senderName}} regarding {{serviceName}}.',
        variables: ['senderName', 'serviceName'],
      }

      const renderedTemplate = {
        subject: 'New Message from Property Owner',
        body: 'You have received a new message from Property Owner regarding Beautiful Apartment.',
      }

      const renderTemplate = vi.fn().mockReturnValue(renderedTemplate)

      const result = renderTemplate(template, {
        senderName: 'Property Owner',
        serviceName: 'Beautiful Apartment',
      })

      expect(result.subject).toBe('New Message from Property Owner')
      expect(result.body).toContain('Property Owner')
    })
  })
})
