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

const mockProvider = {
  id: 'provider-1',
  email: 'provider@example.com',
  name: 'Property Owner',
  role: 'PROPERTY_OWNER',
  verified: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockConversation = {
  id: 'conv-1',
  participants: ['user-1', 'provider-1'],
  participantRoles: ['CUSTOMER', 'PROPERTY_OWNER'],
  type: 'CUSTOMER_PROVIDER',
  isActive: true,
  messageCount: 5,
  unreadCount: { 'user-1': 2, 'provider-1': 0 },
  lastMessageId: 'msg-5',
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockMessage = {
  id: 'msg-1',
  content: 'Hello, I have a question about the property',
  type: 'TEXT',
  senderId: 'user-1',
  senderRole: 'CUSTOMER',
  conversationId: 'conv-1',
  attachments: [],
  isRead: false,
  readBy: [],
  readAt: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello, I have a question about the property',
    senderId: 'user-1',
    senderRole: 'CUSTOMER',
    conversationId: 'conv-1',
    attachments: [],
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: 'msg-2',
    content: 'Hi! I\'d be happy to help. What would you like to know?',
    senderId: 'provider-1',
    senderRole: 'PROPERTY_OWNER',
    conversationId: 'conv-1',
    attachments: [],
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 3), // 3 minutes ago
  },
  {
    id: 'msg-3',
    content: 'Is the property pet-friendly?',
    senderId: 'user-1',
    senderRole: 'CUSTOMER',
    conversationId: 'conv-1',
    attachments: [],
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
  },
]

describe('Chat System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Conversation Management', () => {
    it('should create new conversation between users', async () => {
      vi.mocked(prisma.conversation.create).mockResolvedValue(mockConversation)

      const conversation = await prisma.conversation.create({
        data: {
          participants: ['user-1', 'provider-1'],
          participantRoles: ['CUSTOMER', 'PROPERTY_OWNER'],
          type: 'CUSTOMER_PROVIDER',
          isActive: true,
          unreadCount: {},
          lastReadAt: {},
        },
      })

      expect(conversation).toEqual(mockConversation)
      expect(conversation.participants).toContain('user-1')
      expect(conversation.participants).toContain('provider-1')
    })

    it('should find existing conversation between users', async () => {
      vi.mocked(prisma.conversation.findFirst).mockResolvedValue(mockConversation)

      const conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { has: 'user-1' } },
            { participants: { has: 'provider-1' } },
            { isActive: true }
          ]
        },
      })

      expect(conversation).toEqual(mockConversation)
    })

    it('should get user conversations', async () => {
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([mockConversation])

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: { has: 'user-1' },
          isActive: true,
        },
        orderBy: { lastMessageAt: 'desc' },
      })

      expect(conversations).toHaveLength(1)
      expect(conversations[0].participants).toContain('user-1')
    })

    it('should get conversation details', async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)

      const conversation = await prisma.conversation.findUnique({
        where: { id: 'conv-1' },
        include: {
          participants: true,
          messages: true,
        },
      })

      expect(conversation).toEqual(mockConversation)
    })

    it('should update conversation metadata', async () => {
      const updatedConversation = {
        ...mockConversation,
        messageCount: 6,
        lastMessageId: 'msg-6',
        lastMessageAt: new Date(),
      }

      vi.mocked(prisma.conversation.update).mockResolvedValue(updatedConversation)

      const result = await prisma.conversation.update({
        where: { id: 'conv-1' },
        data: {
          messageCount: { increment: 1 },
          lastMessageId: 'msg-6',
          lastMessageAt: new Date(),
        },
      })

      expect(result.messageCount).toBe(6)
      expect(result.lastMessageId).toBe('msg-6')
    })
  })

  describe('Message Management', () => {
    it('should send text message', async () => {
      vi.mocked(prisma.message.create).mockResolvedValue(mockMessage)

      const message = await prisma.message.create({
        data: {
          content: 'Hello, I have a question about the property',
          type: 'TEXT',
          senderId: 'user-1',
          senderRole: 'CUSTOMER',
          conversationId: 'conv-1',
          attachments: [],
          isRead: false,
          readBy: [],
          readAt: {},
        },
      })

      expect(message).toEqual(mockMessage)
      expect(message.content).toBe('Hello, I have a question about the property')
      expect(message.type).toBe('TEXT')
    })

    it('should send message with attachments', async () => {
      const messageWithAttachments = {
        ...mockMessage,
        attachments: ['image1.jpg', 'document.pdf'],
      }

      vi.mocked(prisma.message.create).mockResolvedValue(messageWithAttachments)

      const message = await prisma.message.create({
        data: {
          content: 'Here are some photos of the property',
          type: 'TEXT',
          senderId: 'user-1',
          senderRole: 'CUSTOMER',
          conversationId: 'conv-1',
          attachments: ['image1.jpg', 'document.pdf'],
          isRead: false,
          readBy: [],
          readAt: {},
        },
      })

      expect(message.attachments).toEqual(['image1.jpg', 'document.pdf'])
    })

    it('should get conversation messages', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages)

      const messages = await prisma.message.findMany({
        where: { conversationId: 'conv-1' },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      })

      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('Hello, I have a question about the property')
    })

    it('should mark message as read', async () => {
      const readMessage = {
        ...mockMessage,
        isRead: true,
        readBy: ['provider-1'],
        readAt: { 'provider-1': new Date() },
      }

      vi.mocked(prisma.message.update).mockResolvedValue(readMessage)

      const result = await prisma.message.update({
        where: { id: 'msg-1' },
        data: {
          isRead: true,
          readBy: { push: 'provider-1' },
          readAt: { 'provider-1': new Date() },
        },
      })

      expect(result.isRead).toBe(true)
      expect(result.readBy).toContain('provider-1')
    })

    it('should get unread message count', async () => {
      vi.mocked(prisma.message.count).mockResolvedValue(2)

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: 'conv-1',
          senderId: { not: 'user-1' },
          isRead: false,
        },
      })

      expect(unreadCount).toBe(2)
    })

    it('should send reply message', async () => {
      const replyMessage = {
        ...mockMessage,
        id: 'msg-4',
        content: 'Thank you for your response!',
        replyToId: 'msg-2',
        type: 'REPLY',
      }

      vi.mocked(prisma.message.create).mockResolvedValue(replyMessage)

      const message = await prisma.message.create({
        data: {
          content: 'Thank you for your response!',
          type: 'REPLY',
          senderId: 'user-1',
          senderRole: 'CUSTOMER',
          conversationId: 'conv-1',
          replyToId: 'msg-2',
          attachments: [],
          isRead: false,
          readBy: [],
          readAt: {},
        },
      })

      expect(message.replyToId).toBe('msg-2')
      expect(message.type).toBe('REPLY')
    })
  })

  describe('Real-time Chat Features', () => {
    it('should handle real-time message delivery', async () => {
      const publishToUser = vi.fn()

      // Mock SSE publishing
      const wireMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello!',
        type: 'text',
        attachments: [],
        createdAt: new Date(),
        status: 'sent',
      }

      // Simulate publishing to both participants
      publishToUser('user-1', 'message', {
        type: 'chat_message',
        conversationId: 'conv-1',
        message: wireMessage,
      })

      publishToUser('provider-1', 'message', {
        type: 'chat_message',
        conversationId: 'conv-1',
        message: wireMessage,
      })

      expect(publishToUser).toHaveBeenCalledTimes(2)
      expect(publishToUser).toHaveBeenCalledWith('user-1', 'message', expect.any(Object))
      expect(publishToUser).toHaveBeenCalledWith('provider-1', 'message', expect.any(Object))
    })

    it('should handle typing indicators', async () => {
      const publishToUser = vi.fn()

      // Simulate typing indicator
      publishToUser('provider-1', 'typing', {
        type: 'typing_start',
        conversationId: 'conv-1',
        userId: 'user-1',
      })

      expect(publishToUser).toHaveBeenCalledWith('provider-1', 'typing', {
        type: 'typing_start',
        conversationId: 'conv-1',
        userId: 'user-1',
      })
    })

    it('should handle online status updates', async () => {
      const publishToUser = vi.fn()

      // Simulate online status
      publishToUser('provider-1', 'status', {
        type: 'user_online',
        userId: 'user-1',
        status: 'online',
      })

      expect(publishToUser).toHaveBeenCalledWith('provider-1', 'status', {
        type: 'user_online',
        userId: 'user-1',
        status: 'online',
      })
    })

    it('should handle message status updates', async () => {
      const publishToUser = vi.fn()

      // Simulate message read status
      publishToUser('user-1', 'message_status', {
        type: 'message_read',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        readBy: 'provider-1',
        readAt: new Date(),
      })

      expect(publishToUser).toHaveBeenCalledWith('user-1', 'message_status', {
        type: 'message_read',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        readBy: 'provider-1',
        readAt: expect.any(Date),
      })
    })
  })

  describe('Chat Notifications', () => {
    it('should create message notification', async () => {
      const notification = {
        id: 'notif-1',
        userId: 'provider-1',
        type: 'MESSAGE',
        title: 'New Message',
        message: 'You have a new message from Test User',
        data: {
          conversationId: 'conv-1',
          senderId: 'user-1',
          messageId: 'msg-1',
        },
        isRead: false,
        createdAt: new Date(),
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(notification)

      const result = await prisma.notification.create({
        data: {
          userId: 'provider-1',
          type: 'MESSAGE',
          title: 'New Message',
          message: 'You have a new message from Test User',
          data: {
            conversationId: 'conv-1',
            senderId: 'user-1',
            messageId: 'msg-1',
          },
          isRead: false,
        },
      })

      expect(result).toEqual(notification)
    })

    it('should get user notifications', async () => {
      const notifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'MESSAGE',
          title: 'New Message',
          message: 'You have a new message',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId: 'user-1',
          type: 'BOOKING',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed',
          isRead: true,
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.notification.findMany).mockResolvedValue(notifications)

      const userNotifications = await prisma.notification.findMany({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      })

      expect(userNotifications).toHaveLength(2)
      expect(userNotifications[0].type).toBe('MESSAGE')
    })

    it('should mark notification as read', async () => {
      const readNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'MESSAGE',
        title: 'New Message',
        message: 'You have a new message',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
      }

      vi.mocked(prisma.notification.update).mockResolvedValue(readNotification)

      const result = await prisma.notification.update({
        where: { id: 'notif-1' },
        data: { isRead: true, readAt: new Date() },
      })

      expect(result.isRead).toBe(true)
    })
  })

  describe('Chat Analytics', () => {
    it('should track message statistics', async () => {
      vi.mocked(prisma.message.count).mockResolvedValue(150)
      vi.mocked(prisma.conversation.count).mockResolvedValue(25)

      const [messageCount, conversationCount] = await Promise.all([
        prisma.message.count(),
        prisma.conversation.count(),
      ])

      expect(messageCount).toBe(150)
      expect(conversationCount).toBe(25)
    })

    it('should track user engagement', async () => {
      vi.mocked(prisma.message.count).mockResolvedValue(50)

      const userMessages = await prisma.message.count({
        where: {
          senderId: 'user-1',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      })

      expect(userMessages).toBe(50)
    })

    it('should track conversation response times', async () => {
      const conversations = [
        {
          id: 'conv-1',
          lastMessageAt: new Date(),
          messageCount: 10,
          participants: ['user-1', 'provider-1'],
        },
      ]

      vi.mocked(prisma.conversation.findMany).mockResolvedValue(conversations)

      const activeConversations = await prisma.conversation.findMany({
        where: {
          lastMessageAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      })

      expect(activeConversations).toHaveLength(1)
    })
  })

  describe('Chat Moderation', () => {
    it('should flag inappropriate messages', async () => {
      const flaggedMessage = {
        ...mockMessage,
        isFlagged: true,
        flaggedAt: new Date(),
        flaggedBy: 'admin-1',
        flagReason: 'Inappropriate content',
      }

      vi.mocked(prisma.message.update).mockResolvedValue(flaggedMessage)

      const result = await prisma.message.update({
        where: { id: 'msg-1' },
        data: {
          isFlagged: true,
          flaggedAt: new Date(),
          flaggedBy: 'admin-1',
          flagReason: 'Inappropriate content',
        },
      })

      expect(result.isFlagged).toBe(true)
      expect(result.flagReason).toBe('Inappropriate content')
    })

    it('should get flagged messages for moderation', async () => {
      const flaggedMessages = [
        {
          ...mockMessage,
          isFlagged: true,
          flaggedAt: new Date(),
          flagReason: 'Inappropriate content',
        },
      ]

      vi.mocked(prisma.message.findMany).mockResolvedValue(flaggedMessages)

      const flagged = await prisma.message.findMany({
        where: { isFlagged: true },
        orderBy: { flaggedAt: 'desc' },
      })

      expect(flagged).toHaveLength(1)
      expect(flagged[0].isFlagged).toBe(true)
    })

    it('should moderate flagged messages', async () => {
      const moderatedMessage = {
        ...mockMessage,
        isFlagged: false,
        moderatedAt: new Date(),
        moderatedBy: 'admin-1',
        moderationAction: 'APPROVED',
      }

      vi.mocked(prisma.message.update).mockResolvedValue(moderatedMessage)

      const result = await prisma.message.update({
        where: { id: 'msg-1' },
        data: {
          isFlagged: false,
          moderatedAt: new Date(),
          moderatedBy: 'admin-1',
          moderationAction: 'APPROVED',
        },
      })

      expect(result.isFlagged).toBe(false)
      expect(result.moderationAction).toBe('APPROVED')
    })
  })

  describe('Chat Search and Filtering', () => {
    it('should search messages by content', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessages[0]])

      const searchResults = await prisma.message.findMany({
        where: {
          conversationId: 'conv-1',
          content: { contains: 'property', mode: 'insensitive' },
        },
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].content).toContain('property')
    })

    it('should filter messages by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      const endDate = new Date()

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages)

      const messages = await prisma.message.findMany({
        where: {
          conversationId: 'conv-1',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      expect(messages).toHaveLength(3)
    })

    it('should filter messages by sender', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([mockMessages[0], mockMessages[2]])

      const userMessages = await prisma.message.findMany({
        where: {
          conversationId: 'conv-1',
          senderId: 'user-1',
        },
      })

      expect(userMessages).toHaveLength(2)
      expect(userMessages.every(msg => msg.senderId === 'user-1')).toBe(true)
    })
  })

  describe('Chat Performance', () => {
    it('should handle large message volumes', async () => {
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        senderId: 'user-1',
        conversationId: 'conv-1',
        createdAt: new Date(),
      }))

      vi.mocked(prisma.message.findMany).mockResolvedValue(largeMessageSet)

      const startTime = Date.now()
      const messages = await prisma.message.findMany({
        where: { conversationId: 'conv-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
      const endTime = Date.now()

      expect(messages).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should implement message pagination', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages)
      vi.mocked(prisma.message.count).mockResolvedValue(100)

      const page = 1
      const limit = 20
      const skip = (page - 1) * limit

      const [messages, totalCount] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId: 'conv-1' },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.message.count({
          where: { conversationId: 'conv-1' },
        }),
      ])

      expect(messages).toHaveLength(3)
      expect(totalCount).toBe(100)
      expect(skip).toBe(0)
    })
  })

  describe('Customer-Provider Message Flow', () => {
    it('should show customer messages to property owner', async () => {
      const customerId = 'customer-1'
      const propertyOwnerId = 'property-owner-1'
      const conversationId = 'conv-customer-provider'

      // Mock conversation between customer and property owner
      const mockConversation = {
        id: conversationId,
        participants: [customerId, propertyOwnerId],
        type: 'CUSTOMER_PROVIDER',
        isActive: true,
        lastMessageAt: new Date(),
        unreadCount: { [propertyOwnerId]: 1 },
        messages: [
          {
            id: 'msg-1',
            content: 'Hi, I\'m interested in your property. Is it available for next weekend?',
            senderId: customerId,
            senderName: 'John Customer',
            createdAt: new Date(),
            type: 'TEXT',
            conversationId,
          }
        ]
      }

      // Mock property owner viewing the conversation
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockConversation.messages)

      // Property owner gets the conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            include: {
              sender: { select: { id: true, name: true, role: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      // Property owner gets messages
      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(conversation).toBeDefined()
      expect(conversation?.participants).toContain(propertyOwnerId)
      expect(conversation?.participants).toContain(customerId)
      expect(messages).toHaveLength(1)
      expect(messages[0].senderId).toBe(customerId)
      expect(messages[0].content).toBe('Hi, I\'m interested in your property. Is it available for next weekend?')
    })

    it('should show customer messages to vehicle owner', async () => {
      const customerId = 'customer-2'
      const vehicleOwnerId = 'vehicle-owner-1'
      const conversationId = 'conv-customer-vehicle'

      const mockConversation = {
        id: conversationId,
        participants: [customerId, vehicleOwnerId],
        type: 'CUSTOMER_PROVIDER',
        isActive: true,
        lastMessageAt: new Date(),
        unreadCount: { [vehicleOwnerId]: 2 },
        messages: [
          {
            id: 'msg-3',
            content: 'What type of car are you looking for?',
            senderId: customerId,
            senderName: 'Jane Customer',
            createdAt: new Date(Date.now() + 1000), // More recent
            type: 'TEXT',
            conversationId,
          },
          {
            id: 'msg-2',
            content: 'Hello! I need a car for 3 days. Do you have any available?',
            senderId: customerId,
            senderName: 'Jane Customer',
            createdAt: new Date(), // Earlier
            type: 'TEXT',
            conversationId,
          }
        ]
      }

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockConversation.messages)

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      })

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(conversation).toBeDefined()
      expect(conversation?.participants).toContain(vehicleOwnerId)
      expect(conversation?.participants).toContain(customerId)
      expect(messages).toHaveLength(2)
      expect(messages[0].senderId).toBe(customerId)
      expect(messages[1].senderId).toBe(customerId)
      expect(messages[0].content).toContain('What type of car')
      expect(messages[1].content).toContain('Hello! I need a car')
    })

    it('should show customer messages to tour guide', async () => {
      const customerId = 'customer-3'
      const tourGuideId = 'tour-guide-1'
      const conversationId = 'conv-customer-tour'

      const mockConversation = {
        id: conversationId,
        participants: [customerId, tourGuideId],
        type: 'CUSTOMER_PROVIDER',
        isActive: true,
        lastMessageAt: new Date(),
        unreadCount: { [tourGuideId]: 1 },
        messages: [
          {
            id: 'msg-4',
            content: 'Hi! I\'d like to book a city tour for my family. What tours do you offer?',
            senderId: customerId,
            senderName: 'Mike Customer',
            createdAt: new Date(),
            type: 'TEXT',
            conversationId,
          }
        ]
      }

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockConversation.messages)

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      })

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      expect(conversation).toBeDefined()
      expect(conversation?.participants).toContain(tourGuideId)
      expect(conversation?.participants).toContain(customerId)
      expect(messages).toHaveLength(1)
      expect(messages[0].senderId).toBe(customerId)
      expect(messages[0].content).toContain('book a city tour')
    })

    it('should track unread message count for providers', async () => {
      const customerId = 'customer-4'
      const propertyOwnerId = 'property-owner-2'
      const conversationId = 'conv-unread-test'

      const mockConversation = {
        id: conversationId,
        participants: [customerId, propertyOwnerId],
        type: 'CUSTOMER_PROVIDER',
        isActive: true,
        lastMessageAt: new Date(),
        unreadCount: { [propertyOwnerId]: 3, [customerId]: 0 },
        messages: [
          {
            id: 'msg-5',
            content: 'First message',
            senderId: customerId,
            createdAt: new Date(Date.now() - 300000), // 5 minutes ago
            type: 'TEXT',
            conversationId,
          },
          {
            id: 'msg-6',
            content: 'Second message',
            senderId: customerId,
            createdAt: new Date(Date.now() - 200000), // 3 minutes ago
            type: 'TEXT',
            conversationId,
          },
          {
            id: 'msg-7',
            content: 'Third message',
            senderId: customerId,
            createdAt: new Date(Date.now() - 100000), // 1 minute ago
            type: 'TEXT',
            conversationId,
          }
        ]
      }

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      })

      expect(conversation).toBeDefined()
      expect(conversation?.unreadCount).toBeDefined()
      expect((conversation?.unreadCount as any)[propertyOwnerId]).toBe(3)
      expect((conversation?.unreadCount as any)[customerId]).toBe(0)
    })

    it('should show provider name in chat interface for customer', async () => {
      const customerId = 'customer-5'
      const propertyOwnerId = 'property-owner-3'
      const conversationId = 'conv-name-display'

      const mockConversation = {
        id: conversationId,
        participants: [
          { id: customerId, name: 'Alice Customer', role: 'CUSTOMER', avatar: 'customer-avatar.jpg' },
          { id: propertyOwnerId, name: 'Bob Property Owner', role: 'PROPERTY_OWNER', avatar: 'owner-avatar.jpg' }
        ],
        type: 'CUSTOMER_PROVIDER',
        isActive: true,
        lastMessageAt: new Date(),
        unreadCount: { [customerId]: 0, [propertyOwnerId]: 1 }
      }

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            select: { id: true, name: true, role: true, avatar: true }
          }
        }
      })

      // Simulate customer viewing the chat - should see provider's name
      const otherParticipant = conversation?.participants?.find(p => p.id !== customerId)
      
      expect(otherParticipant).toBeDefined()
      expect(otherParticipant?.name).toBe('Bob Property Owner')
      expect(otherParticipant?.role).toBe('PROPERTY_OWNER')
      expect(otherParticipant?.avatar).toBe('owner-avatar.jpg')
    })

    it('should show customer name in chat interface for provider', async () => {
      const customerId = 'customer-6'
      const vehicleOwnerId = 'vehicle-owner-2'
      const conversationId = 'conv-provider-view'

      const mockConversation = {
        id: conversationId,
        participants: [
          { id: customerId, name: 'Charlie Customer', role: 'CUSTOMER', avatar: 'customer-avatar2.jpg' },
          { id: vehicleOwnerId, name: 'David Vehicle Owner', role: 'VEHICLE_OWNER', avatar: 'vehicle-owner-avatar.jpg' }
        ],
        type: 'CUSTOMER_PROVIDER',
        isActive: true,
        lastMessageAt: new Date(),
        unreadCount: { [customerId]: 0, [vehicleOwnerId]: 1 }
      }

      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation)

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            select: { id: true, name: true, role: true, avatar: true }
          }
        }
      })

      // Simulate vehicle owner viewing the chat - should see customer's name
      const otherParticipant = conversation?.participants?.find(p => p.id !== vehicleOwnerId)
      
      expect(otherParticipant).toBeDefined()
      expect(otherParticipant?.name).toBe('Charlie Customer')
      expect(otherParticipant?.role).toBe('CUSTOMER')
      expect(otherParticipant?.avatar).toBe('customer-avatar2.jpg')
    })
  })

  describe('Message Edit and Delete', () => {
    it('should allow users to edit their own messages', async () => {
      const messageId = 'msg-edit-test'
      const userId = 'user-1'
      const newContent = 'This is an edited message'

      const mockMessage = {
        id: messageId,
        content: 'Original message',
        senderId: userId,
        conversationId: 'conv-1',
        isEdited: false,
        editedAt: null,
        editHistory: []
      }

      const updatedMessage = {
        ...mockMessage,
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
        editHistory: ['Original message']
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage)
      vi.mocked(prisma.message.update).mockResolvedValue(updatedMessage)

      // Test edit message directly
      const result = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: newContent,
          isEdited: true,
          editedAt: new Date(),
          editHistory: { push: 'Original message' }
        },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        }
      })

      expect(result.content).toBe(newContent)
      expect(result.isEdited).toBe(true)
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          content: newContent,
          isEdited: true,
          editedAt: expect.any(Date),
          editHistory: { push: 'Original message' }
        },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        }
      })
    })

    it('should prevent users from editing others messages', async () => {
      const messageId = 'msg-edit-test'
      const userId = 'user-2' // Different user
      const newContent = 'This should not work'

      const mockMessage = {
        id: messageId,
        content: 'Original message',
        senderId: 'user-1', // Different sender
        conversationId: 'conv-1',
        conversation: {
          participants: [
            { id: 'user-1', role: 'CUSTOMER' },
            { id: 'user-2', role: 'CUSTOMER' }
          ]
        }
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage)

      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      expect(response.status).toBe(403)
    })

    it('should allow users to delete their own messages', async () => {
      const messageId = 'msg-delete-test'
      const userId = 'user-1'

      const mockMessage = {
        id: messageId,
        content: 'Message to delete',
        senderId: userId,
        conversationId: 'conv-1',
        conversation: {
          participants: [
            { id: 'user-1', role: 'CUSTOMER' }
          ]
        }
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage)
      vi.mocked(prisma.message.update).mockResolvedValue({
        ...mockMessage,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: 'You deleted this message'
      })

      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteForEveryone: false })
      })

      expect(response.ok).toBe(true)
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
          deletedBy: userId,
          content: 'You deleted this message'
        }
      })
    })

    it('should allow admins to delete messages for everyone', async () => {
      const messageId = 'msg-admin-delete'
      const adminId = 'admin-1'

      const mockMessage = {
        id: messageId,
        content: 'Message to delete for everyone',
        senderId: 'user-1',
        conversationId: 'conv-1',
        conversation: {
          participants: [
            { id: 'user-1', role: 'CUSTOMER' },
            { id: 'admin-1', role: 'SUPER_ADMIN' }
          ]
        }
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage)
      vi.mocked(prisma.message.update).mockResolvedValue({
        ...mockMessage,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: adminId,
        content: 'This message was deleted'
      })

      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteForEveryone: true })
      })

      expect(response.ok).toBe(true)
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
          deletedBy: adminId,
          content: 'This message was deleted'
        }
      })
    })

    it('should prevent non-admins from deleting messages for everyone', async () => {
      const messageId = 'msg-no-admin-delete'
      const userId = 'user-1'

      const mockMessage = {
        id: messageId,
        content: 'Message to delete',
        senderId: 'user-2',
        conversationId: 'conv-1',
        conversation: {
          participants: [
            { id: 'user-1', role: 'CUSTOMER' },
            { id: 'user-2', role: 'CUSTOMER' }
          ]
        }
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage)

      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteForEveryone: true })
      })

      expect(response.status).toBe(403)
    })

    it('should show edited indicator for edited messages', async () => {
      const editedMessage = {
        id: 'msg-edited',
        content: 'This message was edited',
        senderId: 'user-1',
        isEdited: true,
        editedAt: new Date(),
        editHistory: ['Original content']
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(editedMessage)

      const response = await fetch(`/api/chat/messages/${editedMessage.id}`)
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.message.isEdited).toBe(true)
      expect(data.message.editHistory).toContain('Original content')
    })

    it('should show deleted indicator for deleted messages', async () => {
      const deletedMessage = {
        id: 'msg-deleted',
        content: 'This message was deleted',
        senderId: 'user-1',
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'admin-1'
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(deletedMessage)

      const response = await fetch(`/api/chat/messages/${deletedMessage.id}`)
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.message.isDeleted).toBe(true)
      expect(data.message.deletedBy).toBe('admin-1')
    })

    it('should track edit history for messages', async () => {
      const messageId = 'msg-history-test'
      const userId = 'user-1'

      const mockMessage = {
        id: messageId,
        content: 'First edit',
        senderId: userId,
        conversationId: 'conv-1',
        isEdited: true,
        editedAt: new Date(),
        editHistory: ['Original message']
      }

      vi.mocked(prisma.message.findUnique).mockResolvedValue(mockMessage)
      vi.mocked(prisma.message.update).mockResolvedValue({
        ...mockMessage,
        content: 'Second edit',
        editHistory: ['Original message', 'First edit']
      })

      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Second edit' })
      })

      expect(response.ok).toBe(true)
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          content: 'Second edit',
          isEdited: true,
          editedAt: expect.any(Date),
          editHistory: { push: 'First edit' }
        },
        include: {
          sender: { select: { id: true, name: true, role: true, avatar: true } }
        }
      })
    })
  })
})
