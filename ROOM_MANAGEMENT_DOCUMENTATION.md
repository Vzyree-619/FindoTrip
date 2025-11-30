# Room Management System Documentation

## Overview

This document provides comprehensive documentation for the Booking.com-style hotel room management system implemented in FindoTrip. The system supports multi-room properties where each property can have multiple room types with individual pricing, availability, and booking management.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [User Guides](#user-guides)
4. [API Endpoints](#api-endpoints)
5. [Component Structure](#component-structure)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)

---

## System Architecture

### Key Concepts

1. **Property**: The main accommodation listing (hotel, apartment, etc.)
2. **Room Type**: A specific type of room within a property (e.g., "Deluxe King Room", "Executive Suite")
3. **Room Unit**: Individual physical rooms of a specific type (e.g., 10 "Deluxe King Rooms")
4. **Starting Price**: The lowest price among all room types for a property

### Data Flow

```
Property → Room Types → Bookings
   ↓           ↓            ↓
Base Price  Room Price  Room Booking
```

---

## Database Schema

### RoomType Model

```prisma
model RoomType {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  propertyId     String   @db.ObjectId
  name           String
  description    String
  basePrice      Float
  currency       String   @default("PKR")
  maxOccupancy   Int
  adults         Int
  children       Int
  bedType        String
  numberOfBeds   Int
  bedConfiguration String
  roomSize       Float?
  roomSizeUnit   String   @default("sqm")
  floor          String?
  view           String?
  images         String[]
  mainImage      String?
  amenities      String[]
  features       String[]
  totalUnits     Int      @default(1)
  available      Boolean  @default(true)
  weekendPrice   Float?
  discountPercent Float?
  specialOffer   String?
  smokingAllowed     Boolean @default(false)
  petsAllowed   Boolean @default(false)
  
  property       Property @relation(fields: [propertyId], references: [id])
  bookings       PropertyBooking[]
  
  @@map("RoomType")
}
```

### PropertyBooking Model (Updated)

```prisma
model PropertyBooking {
  // ... existing fields ...
  roomTypeId     String?  @db.ObjectId
  roomRate       Float?
  totalRoomCost  Float?
  numberOfNights Int?
  checkInDate    DateTime?
  checkOutDate   DateTime?
  
  roomType       RoomType? @relation(fields: [roomTypeId], references: [id])
}
```

---

## User Guides

### For Property Owners

#### Adding a New Room Type

1. Navigate to your property dashboard: `/dashboard/provider`
2. Click on the property you want to manage
3. Go to the "Rooms" tab or navigate to `/dashboard/provider/properties/{propertyId}/rooms`
4. Click "Add New Room Type"
5. Fill in the form:
   - **Basic Information**: Name, description
   - **Bed Configuration**: Bed type, number of beds, configuration
   - **Capacity**: Max occupancy, adults, children
   - **Room Details**: Size, floor, view
   - **Images**: Upload at least one image (main image + additional)
   - **Amenities**: Select from common amenities or add custom ones
   - **Pricing**: Base price, currency, optional weekend pricing
   - **Inventory**: Total number of units of this room type
   - **Policies**: Smoking/pets allowed
6. Click "Publish Room Type"

#### Editing a Room Type

1. Navigate to room management: `/dashboard/provider/properties/{propertyId}/rooms`
2. Click "Edit" on the room type you want to modify
3. Update any fields as needed
4. Click "Update Room Type"

#### Managing Room Availability

1. Navigate to room management
2. Click "Manage Availability" on a room type
3. View booking calendar
4. Block dates manually if needed
5. View statistics (bookings, revenue, occupancy rate)

#### Best Practices

- **Room Names**: Use clear, descriptive names (e.g., "Deluxe King Room" not "Room 1")
- **Descriptions**: Include key features, size, view, and what makes it special
- **Images**: Upload high-quality images showing:
  - Main room view
  - Bed area
  - Bathroom
  - Any unique features
- **Pricing**: Research competitor pricing in your area
- **Amenities**: Be accurate - guests will notice discrepancies

---

### For Customers

#### Searching for Accommodations

1. Go to the search page: `/accommodations` or `/search`
2. Enter your destination
3. Select check-in and check-out dates
4. Specify number of guests (adults + children)
5. Apply filters:
   - Price range
   - Property type
   - Amenities
   - Star rating
   - Guest rating
6. Results show "Starting from $XX/night" - the lowest room price

#### Viewing Property Details

1. Click on any property card
2. View property overview, images, amenities
3. Go to "Rooms" tab (opens by default)
4. See all available room types with:
   - Images
   - Bed configuration
   - Capacity
   - Features
   - Pricing
5. Select check-in/check-out dates to see availability
6. Click "Select This Room" on your preferred room type

#### Booking a Room

1. After selecting a room, you'll be redirected to the booking page
2. Review booking summary:
   - Selected room
   - Dates
   - Number of nights
   - Pricing breakdown
3. Enter guest information:
   - Full name
   - Email
   - Phone
   - Special requests
4. Review cancellation policy
5. Accept terms and conditions
6. Click "Continue to Payment"
7. Complete payment
8. Receive booking confirmation

---

## API Endpoints

### Property Owner Endpoints

#### Create Room Type
```
POST /dashboard/provider/properties/:propertyId/rooms/new
```

**Request Body:**
```json
{
  "name": "Deluxe King Room",
  "description": "Spacious room with king bed...",
  "basePrice": 149.00,
  "currency": "USD",
  "maxOccupancy": 2,
  "bedType": "King",
  "numberOfBeds": 1,
  "bedConfiguration": "1 King Bed",
  "totalUnits": 10,
  "amenities": ["Private Bathroom", "WiFi", "TV"],
  "images": ["url1", "url2"]
}
```

#### Update Room Type
```
POST /dashboard/provider/properties/:propertyId/rooms/:roomId/edit
```

#### Delete Room Type
```
POST /dashboard/provider/properties/:propertyId/rooms/:roomId/edit
Body: { "intent": "delete" }
```

#### Get Room Availability
```
GET /dashboard/provider/properties/:propertyId/rooms/:roomId/availability
```

### Customer Endpoints

#### Get Property with Rooms
```
GET /accommodations/:id?checkIn=2024-05-15&checkOut=2024-05-18&adults=2&children=0
```

**Response:**
```json
{
  "accommodation": {
    "id": "...",
    "name": "Grand Plaza Hotel",
    "roomTypes": [
      {
        "id": "...",
        "name": "Deluxe King Room",
        "basePrice": 149,
        "availableUnits": 8,
        "isAvailable": true
      }
    ]
  },
  "searchParams": {
    "checkIn": "2024-05-15",
    "checkOut": "2024-05-18",
    "numberOfNights": 3
  }
}
```

#### Create Booking
```
POST /book/property/:propertyId?roomId=...&checkIn=...&checkOut=...
```

---

## Component Structure

### Client Components

1. **PropertyCard** (`app/components/features/accommodations/PropertyCard.tsx`)
   - Displays property in search results
   - Shows "Starting from" price
   - Room types count

2. **PropertyDetailTabs** (`app/components/property/PropertyDetailTabs.tsx`)
   - Tabbed interface for property details
   - Overview, Rooms, Location, Amenities, Reviews tabs

3. **RoomCard** (`app/components/property/RoomCard.tsx`)
   - Individual room type display
   - Pricing breakdown
   - Availability status
   - Select button

4. **PropertySearchWidget** (`app/components/property/PropertySearchWidget.tsx`)
   - Sticky date/guest selector
   - Updates search parameters

5. **RoomManagement** (`app/components/property/RoomManagement.tsx`)
   - Property owner room management interface
   - Add/edit/delete rooms

### Server Utilities

1. **property.server.ts**
   - `getPropertyStartingPrice()` - Calculate lowest room price
   - `getPropertiesWithStartingPrices()` - List properties with prices
   - `checkRoomAvailability()` - Check if room available for dates
   - `calculateBookingPrice()` - Calculate total booking cost
   - `filterPropertiesByRoomAvailability()` - Filter by availability

---

## Testing Checklist

### Property Cards Display
- [ ] Shows "Starting from $XX/night"
- [ ] Price is the lowest room price
- [ ] Clicking card goes to property detail page
- [ ] All property info displays correctly
- [ ] Room types count shows when applicable

### Property Detail Page
- [ ] Loads property with all rooms
- [ ] Each room card displays correctly
- [ ] Room prices calculate correctly
- [ ] Date/guest selector works
- [ ] Changing dates updates availability
- [ ] "Select Room" button navigates correctly
- [ ] Tabs switch properly
- [ ] Images display correctly

### Room Selection
- [ ] Can select any available room
- [ ] Unavailable rooms show "Sold Out" or "Not Available"
- [ ] Price calculation is accurate
- [ ] All query parameters pass correctly
- [ ] Room details (bed, size, view) display

### Booking Flow
- [ ] Booking page shows correct room
- [ ] All pricing displays correctly
- [ ] Guest form validation works
- [ ] Creates booking in database with roomTypeId
- [ ] Redirects to payment
- [ ] Booking confirmation shows all details
- [ ] Room availability decreases after booking

### Property Owner Dashboard
- [ ] Can view all room types
- [ ] Can add new room type
- [ ] Can edit existing rooms
- [ ] Can upload room images
- [ ] Room saves to database correctly
- [ ] Can manage room availability
- [ ] Statistics display correctly
- [ ] Can delete/deactivate rooms

### Search & Filters
- [ ] Date filter works
- [ ] Guest filter works
- [ ] Price filter works (based on room prices)
- [ ] Amenity filter works
- [ ] Multiple filters work together
- [ ] Results are accurate
- [ ] Only shows properties with available rooms when dates selected

### Admin Panel
- [ ] Can view properties with rooms
- [ ] Can approve properties with rooms
- [ ] Approval checklist includes room validation
- [ ] Can edit room details
- [ ] All admin actions work

---

## Troubleshooting

### Common Issues

#### 1. "Starting from" price not showing correctly
**Solution**: Ensure `getPropertiesWithStartingPrices()` is being used in the loader, and room types are being fetched.

#### 2. Rooms not appearing on property detail page
**Check:**
- Room types exist in database
- `roomTypes` are included in the loader query
- Room `available` field is `true`

#### 3. Availability not updating when dates change
**Check:**
- Date parameters are being passed correctly
- `filterPropertiesByRoomAvailability()` is being called
- Bookings are being queried correctly

#### 4. Booking fails with "Room not available"
**Check:**
- Room availability is checked before booking creation
- Date range doesn't conflict with existing bookings
- `roomTypeId` is being passed correctly

#### 5. Room form validation errors
**Check:**
- All required fields are filled
- Name is at least 5 characters
- Description is at least 50 characters
- At least one image is uploaded
- Price is greater than 0
- Total units is greater than 0

---

## Future Enhancements

1. **Advanced Availability Management**
   - Seasonal pricing
   - Dynamic pricing based on demand
   - Minimum stay requirements per room type

2. **Room Features**
   - Room comparison tool
   - Virtual tours
   - 360° images

3. **Analytics**
   - Revenue per room type
   - Occupancy trends
   - Booking patterns

4. **Bulk Operations**
   - Bulk room creation
   - Bulk price updates
   - Bulk availability blocking

---

## Support

For technical issues or questions:
1. Check this documentation
2. Review error logs in browser console and server logs
3. Verify database schema matches Prisma schema
4. Ensure all migrations have been run

---

**Last Updated**: January 2025
**Version**: 1.0.0

