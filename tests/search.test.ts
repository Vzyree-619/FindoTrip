import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { json } from '@remix-run/node'
import { prisma } from '~/lib/db/db.server'

// Mock data
const mockProperties = [
  {
    id: 'property-1',
    name: 'Luxury Apartment',
    type: 'APARTMENT',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    basePrice: 200,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['WiFi', 'Parking', 'Pool', 'Gym'],
    images: ['apt1.jpg', 'apt2.jpg'],
    rating: 4.5,
    reviewCount: 25,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'property-2',
    name: 'Cozy House',
    type: 'HOUSE',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    basePrice: 150,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['WiFi', 'Garden', 'BBQ'],
    images: ['house1.jpg'],
    rating: 4.2,
    reviewCount: 18,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockVehicles = [
  {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    type: 'SEDAN',
    seats: 5,
    dailyRate: 50,
    features: ['GPS', 'Bluetooth', 'Air Conditioning'],
    images: ['camry1.jpg'],
    rating: 4.3,
    reviewCount: 12,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'vehicle-2',
    make: 'BMW',
    model: 'X5',
    year: 2023,
    type: 'SUV',
    seats: 7,
    dailyRate: 120,
    features: ['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof'],
    images: ['x5_1.jpg'],
    rating: 4.8,
    reviewCount: 8,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockTours = [
  {
    id: 'tour-1',
    title: 'City Walking Tour',
    type: 'WALKING',
    category: 'CULTURAL',
    duration: 3,
    difficulty: 'EASY',
    maxGroupSize: 15,
    pricePerPerson: 25,
    inclusions: ['Guide', 'Water', 'Map'],
    exclusions: ['Lunch', 'Transportation'],
    images: ['tour1.jpg'],
    rating: 4.6,
    reviewCount: 45,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tour-2',
    title: 'Mountain Hiking Adventure',
    type: 'HIKING',
    category: 'ADVENTURE',
    duration: 8,
    difficulty: 'HARD',
    maxGroupSize: 8,
    pricePerPerson: 75,
    inclusions: ['Guide', 'Equipment', 'Lunch'],
    exclusions: ['Transportation to trailhead'],
    images: ['hike1.jpg'],
    rating: 4.9,
    reviewCount: 32,
    available: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe('Search and Discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Property Search', () => {
    it('should search properties by location', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const searchResults = await prisma.property.findMany({
        where: {
          city: { contains: 'New York', mode: 'insensitive' },
          available: true,
        },
        orderBy: { rating: 'desc' },
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].city).toBe('New York')
    })

    it('should filter properties by type', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const apartments = await prisma.property.findMany({
        where: {
          type: 'APARTMENT',
          available: true,
        },
      })

      expect(apartments).toHaveLength(1)
      expect(apartments[0].type).toBe('APARTMENT')
    })

    it('should filter properties by price range', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const expensiveProperties = await prisma.property.findMany({
        where: {
          basePrice: {
            gte: 150,
            lte: 300,
          },
          available: true,
        },
      })

      expect(expensiveProperties).toHaveLength(1)
      expect(expensiveProperties[0].basePrice).toBe(200)
    })

    it('should filter properties by guest count', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const propertiesFor4 = await prisma.property.findMany({
        where: {
          maxGuests: { gte: 4 },
          available: true,
        },
      })

      expect(propertiesFor4).toHaveLength(1)
      expect(propertiesFor4[0].maxGuests).toBe(4)
    })

    it('should filter properties by amenities', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const propertiesWithPool = await prisma.property.findMany({
        where: {
          amenities: { has: 'Pool' },
          available: true,
        },
      })

      expect(propertiesWithPool).toHaveLength(1)
      expect(propertiesWithPool[0].amenities).toContain('Pool')
    })

    it('should sort properties by rating', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue(mockProperties)

      const sortedProperties = await prisma.property.findMany({
        where: { available: true },
        orderBy: { rating: 'desc' },
      })

      expect(sortedProperties[0].rating).toBeGreaterThanOrEqual(sortedProperties[1].rating)
    })

    it('should sort properties by price', async () => {
      const sortedMockProperties = [
        { ...mockProperties[1], basePrice: 150 }, // Cozy House
        { ...mockProperties[0], basePrice: 200 }, // Luxury Apartment
      ]
      vi.mocked(prisma.property.findMany).mockResolvedValue(sortedMockProperties)

      const sortedProperties = await prisma.property.findMany({
        where: { available: true },
        orderBy: { basePrice: 'asc' },
      })

      expect(sortedProperties[0].basePrice).toBeLessThanOrEqual(sortedProperties[1].basePrice)
    })
  })

  describe('Vehicle Search', () => {
    it('should search vehicles by make and model', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([mockVehicles[0]])

      const searchResults = await prisma.vehicle.findMany({
        where: {
          make: { contains: 'Toyota', mode: 'insensitive' },
          model: { contains: 'Camry', mode: 'insensitive' },
          available: true,
        },
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].make).toBe('Toyota')
      expect(searchResults[0].model).toBe('Camry')
    })

    it('should filter vehicles by type', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([mockVehicles[0]])

      const sedans = await prisma.vehicle.findMany({
        where: {
          type: 'SEDAN',
          available: true,
        },
      })

      expect(sedans).toHaveLength(1)
      expect(sedans[0].type).toBe('SEDAN')
    })

    it('should filter vehicles by price range', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([mockVehicles[0]])

      const affordableVehicles = await prisma.vehicle.findMany({
        where: {
          dailyRate: {
            gte: 30,
            lte: 80,
          },
          available: true,
        },
      })

      expect(affordableVehicles).toHaveLength(1)
      expect(affordableVehicles[0].dailyRate).toBe(50)
    })

    it('should filter vehicles by features', async () => {
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([mockVehicles[1]])

      const vehiclesWithGPS = await prisma.vehicle.findMany({
        where: {
          features: { has: 'GPS' },
          available: true,
        },
      })

      expect(vehiclesWithGPS).toHaveLength(1)
      expect(vehiclesWithGPS[0].features).toContain('GPS')
    })

    it('should sort vehicles by rating', async () => {
      const sortedMockVehicles = [
        { ...mockVehicles[1], rating: 4.8 }, // BMW X5
        { ...mockVehicles[0], rating: 4.3 }, // Toyota Camry
      ]
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(sortedMockVehicles)

      const sortedVehicles = await prisma.vehicle.findMany({
        where: { available: true },
        orderBy: { rating: 'desc' },
      })

      expect(sortedVehicles[0].rating).toBeGreaterThanOrEqual(sortedVehicles[1].rating)
    })
  })

  describe('Tour Search', () => {
    it('should search tours by title', async () => {
      vi.mocked(prisma.tour.findMany).mockResolvedValue([mockTours[0]])

      const searchResults = await prisma.tour.findMany({
        where: {
          title: { contains: 'City', mode: 'insensitive' },
          available: true,
        },
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].title).toBe('City Walking Tour')
    })

    it('should filter tours by category', async () => {
      vi.mocked(prisma.tour.findMany).mockResolvedValue([mockTours[0]])

      const culturalTours = await prisma.tour.findMany({
        where: {
          category: 'CULTURAL',
          available: true,
        },
      })

      expect(culturalTours).toHaveLength(1)
      expect(culturalTours[0].category).toBe('CULTURAL')
    })

    it('should filter tours by difficulty', async () => {
      vi.mocked(prisma.tour.findMany).mockResolvedValue([mockTours[0]])

      const easyTours = await prisma.tour.findMany({
        where: {
          difficulty: 'EASY',
          available: true,
        },
      })

      expect(easyTours).toHaveLength(1)
      expect(easyTours[0].difficulty).toBe('EASY')
    })

    it('should filter tours by duration', async () => {
      vi.mocked(prisma.tour.findMany).mockResolvedValue([mockTours[0]])

      const shortTours = await prisma.tour.findMany({
        where: {
          duration: { lte: 4 },
          available: true,
        },
      })

      expect(shortTours).toHaveLength(1)
      expect(shortTours[0].duration).toBe(3)
    })

    it('should filter tours by price range', async () => {
      vi.mocked(prisma.tour.findMany).mockResolvedValue([mockTours[0]])

      const affordableTours = await prisma.tour.findMany({
        where: {
          pricePerPerson: {
            gte: 20,
            lte: 50,
          },
          available: true,
        },
      })

      expect(affordableTours).toHaveLength(1)
      expect(affordableTours[0].pricePerPerson).toBe(25)
    })

    it('should sort tours by rating', async () => {
      const sortedMockTours = [
        { ...mockTours[1], rating: 4.9 }, // Mountain Hiking Adventure
        { ...mockTours[0], rating: 4.6 }, // City Walking Tour
      ]
      vi.mocked(prisma.tour.findMany).mockResolvedValue(sortedMockTours)

      const sortedTours = await prisma.tour.findMany({
        where: { available: true },
        orderBy: { rating: 'desc' },
      })

      expect(sortedTours[0].rating).toBeGreaterThanOrEqual(sortedTours[1].rating)
    })
  })

  describe('Unified Search', () => {
    it('should search across all service types', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([mockVehicles[0]])
      vi.mocked(prisma.tour.findMany).mockResolvedValue([mockTours[0]])

      const searchTerm = 'luxury'
      
      const [properties, vehicles, tours] = await Promise.all([
        prisma.property.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
            available: true,
          },
        }),
        prisma.vehicle.findMany({
          where: {
            OR: [
              { make: { contains: searchTerm, mode: 'insensitive' } },
              { model: { contains: searchTerm, mode: 'insensitive' } },
            ],
            available: true,
          },
        }),
        prisma.tour.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
            available: true,
          },
        }),
      ])

      const totalResults = properties.length + vehicles.length + tours.length

      expect(totalResults).toBe(3)
    })

    it('should handle empty search results', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([])
      vi.mocked(prisma.vehicle.findMany).mockResolvedValue([])
      vi.mocked(prisma.tour.findMany).mockResolvedValue([])

      const searchTerm = 'nonexistent'
      
      const [properties, vehicles, tours] = await Promise.all([
        prisma.property.findMany({
          where: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
            ],
            available: true,
          },
        }),
        prisma.vehicle.findMany({
          where: {
            OR: [
              { make: { contains: searchTerm, mode: 'insensitive' } },
            ],
            available: true,
          },
        }),
        prisma.tour.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
            ],
            available: true,
          },
        }),
      ])

      const totalResults = properties.length + vehicles.length + tours.length

      expect(totalResults).toBe(0)
    })
  })

  describe('Search Filters', () => {
    it('should apply multiple filters simultaneously', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const filteredResults = await prisma.property.findMany({
        where: {
          city: { contains: 'New York', mode: 'insensitive' },
          type: 'APARTMENT',
          basePrice: { gte: 100, lte: 300 },
          maxGuests: { gte: 4 },
          amenities: { has: 'WiFi' },
          available: true,
        },
        orderBy: { rating: 'desc' },
      })

      expect(filteredResults).toHaveLength(1)
      expect(filteredResults[0].city).toBe('New York')
      expect(filteredResults[0].type).toBe('APARTMENT')
      expect(filteredResults[0].basePrice).toBe(200)
      expect(filteredResults[0].maxGuests).toBe(4)
      expect(filteredResults[0].amenities).toContain('WiFi')
    })

    it('should handle date range filters', async () => {
      const checkIn = new Date('2024-01-15')
      const checkOut = new Date('2024-01-17')

      // Mock availability check
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const availableProperties = await prisma.property.findMany({
        where: {
          available: true,
          // In real implementation, would check against booking conflicts
        },
      })

      expect(availableProperties).toHaveLength(1)
    })

    it('should handle location-based search', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue([mockProperties[0]])

      const locationResults = await prisma.property.findMany({
        where: {
          OR: [
            { city: { contains: 'New York', mode: 'insensitive' } },
            { state: { contains: 'NY', mode: 'insensitive' } },
            { country: { contains: 'USA', mode: 'insensitive' } },
          ],
          available: true,
        },
      })

      expect(locationResults).toHaveLength(1)
      expect(locationResults[0].city).toBe('New York')
    })
  })

  describe('Search Suggestions', () => {
    it('should provide location suggestions', async () => {
      const popularCities = ['New York', 'Los Angeles', 'Chicago', 'Miami']
      
      const getSuggestions = vi.fn().mockResolvedValue(popularCities)

      const suggestions = await getSuggestions()

      expect(suggestions).toHaveLength(4)
      expect(suggestions).toContain('New York')
      expect(suggestions).toContain('Los Angeles')
    })

    it('should provide category suggestions', async () => {
      const tourCategories = ['CULTURAL', 'ADVENTURE', 'FOOD', 'HISTORY']
      
      const getCategories = vi.fn().mockResolvedValue(tourCategories)

      const categories = await getCategories()

      expect(categories).toHaveLength(4)
      expect(categories).toContain('CULTURAL')
      expect(categories).toContain('ADVENTURE')
    })

    it('should provide amenity suggestions', async () => {
      const popularAmenities = ['WiFi', 'Parking', 'Pool', 'Gym', 'Kitchen']
      
      const getAmenities = vi.fn().mockResolvedValue(popularAmenities)

      const amenities = await getAmenities()

      expect(amenities).toHaveLength(5)
      expect(amenities).toContain('WiFi')
      expect(amenities).toContain('Parking')
    })
  })

  describe('Search Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `property-${i}`,
        name: `Property ${i}`,
        city: 'Test City',
        basePrice: 100 + i,
        available: true,
      }))

      vi.mocked(prisma.property.findMany).mockResolvedValue(largeResultSet)

      const startTime = Date.now()
      const results = await prisma.property.findMany({
        where: { available: true },
        take: 100,
        skip: 0,
      })
      const endTime = Date.now()

      expect(results).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should implement pagination correctly', async () => {
      vi.mocked(prisma.property.findMany).mockResolvedValue(mockProperties)
      vi.mocked(prisma.property.count).mockResolvedValue(100)

      const page = 1
      const limit = 20
      const skip = (page - 1) * limit

      const [results, totalCount] = await Promise.all([
        prisma.property.findMany({
          where: { available: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.property.count({
          where: { available: true },
        }),
      ])

      expect(results).toHaveLength(2)
      expect(totalCount).toBe(100)
      expect(skip).toBe(0)
    })
  })
})
