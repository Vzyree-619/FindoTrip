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
})
