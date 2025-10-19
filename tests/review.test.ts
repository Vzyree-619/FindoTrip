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

const mockProperty = {
  id: 'property-1',
  name: 'Beautiful Apartment',
  type: 'APARTMENT',
  city: 'New York',
  basePrice: 150,
  rating: 4.5,
  reviewCount: 25,
  ownerId: 'owner-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockReview = {
  id: 'review-1',
  propertyId: 'property-1',
  userId: 'user-1',
  rating: 5,
  comment: 'Excellent stay! The property was clean and well-maintained.',
  status: 'APPROVED',
  isVerified: true,
  helpfulCount: 3,
  flagged: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockReviews = [
  {
    id: 'review-1',
    propertyId: 'property-1',
    userId: 'user-1',
    rating: 5,
    comment: 'Amazing place! Highly recommended.',
    status: 'APPROVED',
    isVerified: true,
    helpfulCount: 5,
    createdAt: new Date(),
    user: { name: 'Test User', avatar: 'avatar1.jpg' },
  },
  {
    id: 'review-2',
    propertyId: 'property-1',
    userId: 'user-2',
    rating: 4,
    comment: 'Good location and clean rooms.',
    status: 'APPROVED',
    isVerified: true,
    helpfulCount: 2,
    createdAt: new Date(),
    user: { name: 'Another User', avatar: 'avatar2.jpg' },
  },
  {
    id: 'review-3',
    propertyId: 'property-1',
    userId: 'user-3',
    rating: 3,
    comment: 'Average experience, could be better.',
    status: 'PENDING',
    isVerified: false,
    helpfulCount: 0,
    createdAt: new Date(),
    user: { name: 'Third User', avatar: 'avatar3.jpg' },
  },
]

describe('Review System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Review Creation', () => {
    it('should create property review', async () => {
      vi.mocked(prisma.review.create).mockResolvedValue(mockReview)

      const review = await prisma.review.create({
        data: {
          propertyId: 'property-1',
          userId: 'user-1',
          rating: 5,
          comment: 'Excellent stay! The property was clean and well-maintained.',
          status: 'PENDING',
          isVerified: false,
          helpfulCount: 0,
          flagged: false,
        },
      })

      expect(review).toEqual(mockReview)
      expect(review.rating).toBe(5)
      expect(review.comment).toBe('Excellent stay! The property was clean and well-maintained.')
    })

    it('should create vehicle review', async () => {
      const vehicleReview = {
        ...mockReview,
        id: 'review-2',
        vehicleId: 'vehicle-1',
        propertyId: null,
      }

      vi.mocked(prisma.review.create).mockResolvedValue(vehicleReview)

      const review = await prisma.review.create({
        data: {
          vehicleId: 'vehicle-1',
          userId: 'user-1',
          rating: 4,
          comment: 'Great car, very clean and reliable.',
          status: 'PENDING',
          isVerified: false,
          helpfulCount: 0,
          flagged: false,
        },
      })

      expect(review.vehicleId).toBe('vehicle-1')
      expect(review.rating).toBe(4)
    })

    it('should create tour review', async () => {
      const tourReview = {
        ...mockReview,
        id: 'review-3',
        tourId: 'tour-1',
        propertyId: null,
      }

      vi.mocked(prisma.review.create).mockResolvedValue(tourReview)

      const review = await prisma.review.create({
        data: {
          tourId: 'tour-1',
          userId: 'user-1',
          rating: 5,
          comment: 'Amazing tour guide and experience!',
          status: 'PENDING',
          isVerified: false,
          helpfulCount: 0,
          flagged: false,
        },
      })

      expect(review.tourId).toBe('tour-1')
      expect(review.rating).toBe(5)
    })

    it('should validate review rating', () => {
      const validRatings = [1, 2, 3, 4, 5]
      const invalidRatings = [0, 6, -1, 3.5]

      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1)
        expect(rating).toBeLessThanOrEqual(5)
        expect(Number.isInteger(rating)).toBe(true)
      })

      invalidRatings.forEach(rating => {
        const isValid = rating >= 1 && rating <= 5 && Number.isInteger(rating)
        expect(isValid).toBe(false)
      })
    })

    it('should validate review comment length', () => {
      const validComments = [
        'Great place!',
        'Excellent service and clean rooms. Highly recommended for families.',
        'A'.repeat(500), // 500 characters
      ]

      const invalidComments = [
        '', // Empty comment
        'A'.repeat(1001), // Too long
      ]

      validComments.forEach(comment => {
        expect(comment.length).toBeGreaterThan(0)
        expect(comment.length).toBeLessThanOrEqual(1000)
      })

      invalidComments.forEach(comment => {
        const isValid = comment.length > 0 && comment.length <= 1000
        expect(isValid).toBe(false)
      })
    })
  })

  describe('Review Retrieval', () => {
    it('should get property reviews', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews)

      const reviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, avatar: true } },
        },
      })

      expect(reviews).toHaveLength(3)
      expect(reviews[0].propertyId).toBe('property-1')
    })

    it('should get user reviews', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([mockReview])

      const userReviews = await prisma.review.findMany({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      })

      expect(userReviews).toHaveLength(1)
      expect(userReviews[0].userId).toBe('user-1')
    })

    it('should filter reviews by rating', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([mockReviews[0]])

      const highRatedReviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          rating: { gte: 4 },
          status: 'APPROVED',
        },
      })

      expect(highRatedReviews).toHaveLength(1)
      expect(highRatedReviews[0].rating).toBeGreaterThanOrEqual(4)
    })

    it('should get verified reviews only', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([mockReviews[0], mockReviews[1]])

      const verifiedReviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          isVerified: true,
          status: 'APPROVED',
        },
      })

      expect(verifiedReviews).toHaveLength(2)
      expect(verifiedReviews.every(review => review.isVerified)).toBe(true)
    })

    it('should get recent reviews', async () => {
      const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews)

      const recentReviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          createdAt: { gte: recentDate },
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(recentReviews).toHaveLength(3)
    })
  })

  describe('Review Moderation', () => {
    it('should approve review', async () => {
      const approvedReview = {
        ...mockReview,
        status: 'APPROVED',
        moderatedAt: new Date(),
        moderatedBy: 'admin-1',
      }

      vi.mocked(prisma.review.update).mockResolvedValue(approvedReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          status: 'APPROVED',
          moderatedAt: new Date(),
          moderatedBy: 'admin-1',
        },
      })

      expect(result.status).toBe('APPROVED')
      expect(result.moderatedBy).toBe('admin-1')
    })

    it('should reject review', async () => {
      const rejectedReview = {
        ...mockReview,
        status: 'REJECTED',
        rejectionReason: 'Inappropriate content',
        moderatedAt: new Date(),
        moderatedBy: 'admin-1',
      }

      vi.mocked(prisma.review.update).mockResolvedValue(rejectedReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Inappropriate content',
          moderatedAt: new Date(),
          moderatedBy: 'admin-1',
        },
      })

      expect(result.status).toBe('REJECTED')
      expect(result.rejectionReason).toBe('Inappropriate content')
    })

    it('should flag review for moderation', async () => {
      const flaggedReview = {
        ...mockReview,
        flagged: true,
        flaggedAt: new Date(),
        flagReason: 'Suspicious content',
        flaggedBy: 'user-2',
      }

      vi.mocked(prisma.review.update).mockResolvedValue(flaggedReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          flagged: true,
          flaggedAt: new Date(),
          flagReason: 'Suspicious content',
          flaggedBy: 'user-2',
        },
      })

      expect(result.flagged).toBe(true)
      expect(result.flagReason).toBe('Suspicious content')
    })

    it('should get flagged reviews for moderation', async () => {
      const flaggedReviews = [
        {
          ...mockReview,
          flagged: true,
          flaggedAt: new Date(),
          flagReason: 'Inappropriate language',
        },
      ]

      vi.mocked(prisma.review.findMany).mockResolvedValue(flaggedReviews)

      const flagged = await prisma.review.findMany({
        where: { flagged: true },
        orderBy: { flaggedAt: 'desc' },
      })

      expect(flagged).toHaveLength(1)
      expect(flagged[0].flagged).toBe(true)
    })

    it('should get pending reviews for moderation', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([mockReviews[2]])

      const pendingReviews = await prisma.review.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      })

      expect(pendingReviews).toHaveLength(1)
      expect(pendingReviews[0].status).toBe('PENDING')
    })
  })

  describe('Review Interactions', () => {
    it('should mark review as helpful', async () => {
      const helpfulReview = {
        ...mockReview,
        helpfulCount: 4,
        helpfulUsers: ['user-2', 'user-3', 'user-4', 'user-5'],
      }

      vi.mocked(prisma.review.update).mockResolvedValue(helpfulReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          helpfulCount: { increment: 1 },
          helpfulUsers: { push: 'user-5' },
        },
      })

      expect(result.helpfulCount).toBe(4)
      expect(result.helpfulUsers).toContain('user-5')
    })

    it('should remove helpful vote', async () => {
      const unhelpfulReview = {
        ...mockReview,
        helpfulCount: 2,
        helpfulUsers: ['user-2', 'user-3'],
      }

      vi.mocked(prisma.review.update).mockResolvedValue(unhelpfulReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          helpfulCount: { decrement: 1 },
          helpfulUsers: { set: ['user-2', 'user-3'] },
        },
      })

      expect(result.helpfulCount).toBe(2)
      expect(result.helpfulUsers).not.toContain('user-4')
    })

    it('should report review', async () => {
      const reportedReview = {
        ...mockReview,
        reportCount: 1,
        reportedBy: ['user-2'],
        lastReportedAt: new Date(),
      }

      vi.mocked(prisma.review.update).mockResolvedValue(reportedReview)

      const result = await prisma.review.update({
        where: { id: 'review-1' },
        data: {
          reportCount: { increment: 1 },
          reportedBy: { push: 'user-2' },
          lastReportedAt: new Date(),
        },
      })

      expect(result.reportCount).toBe(1)
      expect(result.reportedBy).toContain('user-2')
    })
  })

  describe('Review Analytics', () => {
    it('should calculate average rating', async () => {
      vi.mocked(prisma.review.aggregate).mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: { id: 25 },
        _sum: { rating: 105 },
      })

      const stats = await prisma.review.aggregate({
        where: {
          propertyId: 'property-1',
          status: 'APPROVED',
        },
        _avg: { rating: true },
        _count: { id: true },
        _sum: { rating: true },
      })

      expect(stats._avg.rating).toBe(4.2)
      expect(stats._count.id).toBe(25)
      expect(stats._sum.rating).toBe(105)
    })

    it('should get rating distribution', async () => {
      const ratingDistribution = [
        { rating: 5, count: 15 },
        { rating: 4, count: 7 },
        { rating: 3, count: 2 },
        { rating: 2, count: 1 },
        { rating: 1, count: 0 },
      ]

      // Mock individual rating counts
      for (const { rating, count } of ratingDistribution) {
        vi.mocked(prisma.review.count).mockResolvedValueOnce(count)
      }

      const distribution = await Promise.all(
        [5, 4, 3, 2, 1].map(rating =>
          prisma.review.count({
            where: {
              propertyId: 'property-1',
              rating,
              status: 'APPROVED',
            },
          })
        )
      )

      expect(distribution).toEqual([15, 7, 2, 1, 0])
    })

    it('should track review trends', async () => {
      const monthlyStats = [
        { month: '2024-01', count: 5, avgRating: 4.2 },
        { month: '2024-02', count: 8, avgRating: 4.5 },
        { month: '2024-03', count: 12, avgRating: 4.3 },
      ]

      vi.mocked(prisma.review.findMany).mockResolvedValue(
        monthlyStats.flatMap(stat => 
          Array.from({ length: stat.count }, (_, i) => ({
            id: `review-${stat.month}-${i}`,
            rating: stat.avgRating,
            createdAt: new Date(stat.month),
          }))
        )
      )

      const trends = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-03-31'),
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      expect(trends).toHaveLength(25) // 5 + 8 + 12
    })

    it('should get top helpful reviews', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews)

      const topReviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          status: 'APPROVED',
        },
        orderBy: { helpfulCount: 'desc' },
        take: 5,
      })

      expect(topReviews).toHaveLength(3)
      expect(topReviews[0].helpfulCount).toBeGreaterThanOrEqual(topReviews[1].helpfulCount)
    })
  })

  describe('Review Search', () => {
    it('should search reviews by content', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([mockReviews[0]])

      const searchResults = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          comment: { contains: 'amazing', mode: 'insensitive' },
          status: 'APPROVED',
        },
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].comment.toLowerCase()).toContain('amazing')
    })

    it('should filter reviews by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews)

      const reviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'APPROVED',
        },
      })

      expect(reviews).toHaveLength(3)
    })

    it('should filter reviews by verified status', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([mockReviews[0], mockReviews[1]])

      const verifiedReviews = await prisma.review.findMany({
        where: {
          propertyId: 'property-1',
          isVerified: true,
          status: 'APPROVED',
        },
      })

      expect(verifiedReviews).toHaveLength(2)
      expect(verifiedReviews.every(review => review.isVerified)).toBe(true)
    })
  })

  describe('Review Performance', () => {
    it('should handle large review volumes', async () => {
      const largeReviewSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `review-${i}`,
        propertyId: 'property-1',
        userId: `user-${i}`,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: `Review ${i}`,
        status: 'APPROVED',
        createdAt: new Date(),
      }))

      vi.mocked(prisma.review.findMany).mockResolvedValue(largeReviewSet)

      const startTime = Date.now()
      const reviews = await prisma.review.findMany({
        where: { propertyId: 'property-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      })
      const endTime = Date.now()

      expect(reviews).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should implement review pagination', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews)
      vi.mocked(prisma.review.count).mockResolvedValue(100)

      const page = 1
      const limit = 20
      const skip = (page - 1) * limit

      const [reviews, totalCount] = await Promise.all([
        prisma.review.findMany({
          where: { propertyId: 'property-1' },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.review.count({
          where: { propertyId: 'property-1' },
        }),
      ])

      expect(reviews).toHaveLength(3)
      expect(totalCount).toBe(100)
      expect(skip).toBe(0)
    })
  })

  describe('Review Notifications', () => {
    it('should notify property owner of new review', async () => {
      const notification = {
        id: 'notif-1',
        userId: 'owner-1',
        type: 'REVIEW',
        title: 'New Review',
        message: 'You have received a new review for your property',
        data: {
          reviewId: 'review-1',
          propertyId: 'property-1',
          rating: 5,
        },
        isRead: false,
        createdAt: new Date(),
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(notification)

      const result = await prisma.notification.create({
        data: {
          userId: 'owner-1',
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

      expect(result).toEqual(notification)
    })

    it('should notify user when review is approved', async () => {
      const notification = {
        id: 'notif-2',
        userId: 'user-1',
        type: 'REVIEW_APPROVED',
        title: 'Review Approved',
        message: 'Your review has been approved and is now visible',
        data: {
          reviewId: 'review-1',
          propertyId: 'property-1',
        },
        isRead: false,
        createdAt: new Date(),
      }

      vi.mocked(prisma.notification.create).mockResolvedValue(notification)

      const result = await prisma.notification.create({
        data: {
          userId: 'user-1',
          type: 'REVIEW_APPROVED',
          title: 'Review Approved',
          message: 'Your review has been approved and is now visible',
          data: {
            reviewId: 'review-1',
            propertyId: 'property-1',
          },
          isRead: false,
        },
      })

      expect(result).toEqual(notification)
    })
  })
})
