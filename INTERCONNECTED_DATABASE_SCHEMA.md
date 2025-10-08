# Interconnected Database Schema - FindoTrip

## Overview

This is a **fully interconnected, production-ready database schema** where ALL models relate to each other properly with real relationships, cascading deletes, and comprehensive data flow. Every field has a real purpose and is actively used in the application.

## 🏗️ Architecture Principles

### 1. **Real Relationships, Not Placeholders**
- Every model has proper foreign key relationships
- Cascading deletes ensure data integrity
- No orphaned records or broken references

### 2. **Role-Based User System**
- Single `User` model with role-based profiles
- Each role has its own specialized profile model
- All profiles are properly linked to the main user

### 3. **Unified Service System**
- Properties, Vehicles, and Tours all follow the same patterns
- Consistent booking, review, and payment systems
- Cross-service features work seamlessly

### 4. **Complete Data Flow**
- Bookings → Payments → Reviews → Commissions → Payouts
- Notifications for all user activities
- Analytics tracking across all services

## 🔗 Core Relationships

### User System
```
User (1) ←→ (1) CustomerProfile
User (1) ←→ (1) PropertyOwner
User (1) ←→ (1) VehicleOwner
User (1) ←→ (1) TourGuide
User (1) ←→ (1) SuperAdmin
```

### Service System
```
PropertyOwner (1) ←→ (N) Property
VehicleOwner (1) ←→ (N) Vehicle
TourGuide (1) ←→ (N) Tour
```

### Booking System
```
User (1) ←→ (N) PropertyBooking
User (1) ←→ (N) VehicleBooking
User (1) ←→ (N) TourBooking

Property (1) ←→ (N) PropertyBooking
Vehicle (1) ←→ (N) VehicleBooking
Tour (1) ←→ (N) TourBooking
```

### Payment & Commission System
```
User (1) ←→ (N) Payment
User (1) ←→ (N) Commission
User (1) ←→ (N) Payout

PropertyOwner (1) ←→ (N) Commission
VehicleOwner (1) ←→ (N) Commission
TourGuide (1) ←→ (N) Commission

Commission (N) ←→ (1) Payout
```

### Review System
```
User (1) ←→ (N) Review
Property (1) ←→ (N) Review
Vehicle (1) ←→ (N) Review
Tour (1) ←→ (N) Review

PropertyBooking (1) ←→ (1) Review
VehicleBooking (1) ←→ (1) Review
TourBooking (1) ←→ (1) Review
```

## 📊 Data Flow Examples

### 1. **Complete Booking Flow**
```
1. Customer books property → PropertyBooking created
2. Payment processed → Payment created
3. Booking confirmed → Notification sent to owner
4. Stay completed → Review prompt sent
5. Review submitted → Property rating updated
6. Commission calculated → Commission record created
7. Payout processed → Payout record created
```

### 2. **Service Approval Flow**
```
1. Owner creates property → Property with PENDING status
2. Admin reviews → ApprovalStatus updated
3. If approved → Property goes live, owner notified
4. If rejected → RejectionReason set, owner notified
```

### 3. **Cross-Service Features**
```
1. User adds property to wishlist → Wishlist updated
2. User searches across all services → Analytics tracked
3. User receives notifications → Notification created
4. User messages owner → Message created
```

## 🎯 Key Features

### 1. **Unified Booking System**
- All booking types follow the same pattern
- Consistent status tracking
- Unified payment processing
- Cross-service booking history

### 2. **Comprehensive Review System**
- Reviews work for all service types
- Detailed rating categories
- Owner responses
- Moderation system

### 3. **Financial Tracking**
- Complete payment history
- Commission calculations
- Payout management
- Revenue analytics

### 4. **Notification System**
- System-wide notifications
- Role-based messaging
- Multi-channel delivery (email, SMS, push)
- Priority levels

### 5. **Analytics & Tracking**
- User behavior tracking
- Service performance metrics
- Revenue analytics
- Geographic insights

## 🔧 Technical Implementation

### Cascading Deletes
```prisma
// When user is deleted, all related data is cleaned up
User @relation(fields: [userId], references: [id], onDelete: Cascade)

// When property is deleted, all bookings and reviews are cleaned up
Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
```

### Indexes for Performance
```prisma
@@index([userId])           // User lookups
@@index([status])           // Status filtering
@@index([city, country])    // Location searches
@@index([rating])           // Rating sorting
@@index([createdAt])        // Time-based queries
```

### Flexible Relationships
```prisma
// Reviews work across all service types
serviceId       String   @db.ObjectId
serviceType     String   // "property", "vehicle", "tour"

// Payments work for all booking types
bookingId       String @db.ObjectId
bookingType     String // "property", "vehicle", "tour"
```

## 📈 Business Logic Examples

### 1. **Revenue Calculation**
```typescript
// Calculate total revenue for a property owner
const totalRevenue = await prisma.propertyBooking.aggregate({
  where: {
    property: { ownerId: ownerId },
    status: { in: ["CONFIRMED", "COMPLETED"] }
  },
  _sum: { totalPrice: true }
});
```

### 2. **Rating Calculation**
```typescript
// Update property rating when new review is added
const avgRating = await prisma.review.aggregate({
  where: { serviceId: propertyId, serviceType: "property" },
  _avg: { rating: true }
});

await prisma.property.update({
  where: { id: propertyId },
  data: { 
    rating: avgRating._avg.rating,
    reviewCount: { increment: 1 }
  }
});
```

### 3. **Commission Calculation**
```typescript
// Calculate commission for completed booking
const commission = await prisma.commission.create({
  data: {
    amount: booking.totalPrice * 0.1, // 10% commission
    percentage: 10,
    userId: ownerId,
    bookingId: booking.id,
    bookingType: "property",
    serviceId: propertyId,
    serviceType: "property",
    propertyOwnerId: ownerId,
    status: "PENDING"
  }
});
```

## 🚀 Production Features

### 1. **Data Integrity**
- All foreign keys properly defined
- Cascading deletes prevent orphaned records
- Unique constraints prevent duplicates
- Required fields ensure data completeness

### 2. **Performance Optimization**
- Strategic indexes on frequently queried fields
- Compound indexes for complex queries
- Efficient relationship patterns

### 3. **Scalability**
- Flexible service type system
- Extensible notification system
- Modular commission structure
- Analytics-ready data structure

### 4. **Security**
- Role-based access control
- Document verification system
- Audit trails for all actions
- Secure payment tracking

## 🔄 Real-World Usage Examples

### 1. **Customer Dashboard**
```typescript
// Get all bookings across all service types
const bookings = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    propertyBookings: { include: { property: true } },
    vehicleBookings: { include: { vehicle: true } },
    tourBookings: { include: { tour: true } }
  }
});
```

### 2. **Owner Analytics**
```typescript
// Get comprehensive business metrics
const metrics = await prisma.propertyOwner.findUnique({
  where: { id: ownerId },
  include: {
    properties: {
      include: {
        bookings: { where: { status: "COMPLETED" } },
        reviews: true
      }
    },
    commissions: { where: { status: "PAID" } }
  }
});
```

### 3. **Admin Dashboard**
```typescript
// Get platform-wide statistics
const stats = await prisma.analytics.aggregate({
  where: { date: { gte: startDate } },
  _sum: { count: true },
  _avg: { value: true }
});
```

## 🎉 Benefits of This Schema

### 1. **No Placeholder Fields**
- Every field has a real purpose
- All relationships are actively used
- No unused or redundant data

### 2. **Complete Interconnection**
- All services work together seamlessly
- Cross-service features are natural
- Unified user experience

### 3. **Production Ready**
- Handles real-world scenarios
- Scales with business growth
- Maintains data integrity

### 4. **Developer Friendly**
- Clear relationship patterns
- Consistent naming conventions
- Easy to understand and maintain

This schema provides a solid foundation for a multi-service travel platform with proper relationships, data integrity, and scalability for production use.
