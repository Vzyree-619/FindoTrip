# FindoTrip Multi-Service Booking Platform - Database Schema

This document describes the comprehensive database schema for the FindoTrip multi-service booking platform with role-based architecture and approval workflows.

## 🏗 Architecture Overview

The database is designed with a **role-based multi-service architecture** supporting:
- **5 User Roles**: Customer, Property Owner, Vehicle Owner, Tour Guide, Super Admin
- **3 Service Types**: Properties (accommodations), Vehicles (rentals), Tours (experiences)
- **3 Booking Types**: Property Bookings, Vehicle Bookings, Tour Bookings
- **Comprehensive Approval System**: Admin review workflows for all listings

## 👥 User Management System

### Core User Model
```prisma
model User {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  email       String   @unique
  password    String
  name        String
  role        UserRole @default(CUSTOMER)
  // ... security, preferences, and tracking fields
}
```

### Role-Specific Profiles

#### 1. CustomerProfile
- **Purpose**: Customers who book services
- **Key Features**: 
  - Personal information and preferences
  - Travel preferences and accessibility needs
  - Loyalty program with tiers (Bronze, Silver, Gold, Platinum)
  - Booking statistics and spending tracking

#### 2. PropertyOwner
- **Purpose**: Accommodation providers (hotels, apartments, etc.)
- **Key Features**:
  - Business information and licensing
  - Banking details for payments
  - Verification levels (Basic, Verified, Premium)
  - Business metrics (response rate, revenue tracking)
  - Property management settings

#### 3. VehicleOwner
- **Purpose**: Car rental and transport providers
- **Key Features**:
  - Fleet management information
  - Driver credentials and licensing
  - Insurance and safety documentation
  - Service area management
  - Vehicle maintenance tracking

#### 4. TourGuide
- **Purpose**: Tour and experience providers
- **Key Features**:
  - Professional credentials and certifications
  - Language and specialization tracking
  - Availability and scheduling management
  - Pricing and group size settings
  - Background verification

#### 5. SuperAdmin
- **Purpose**: Platform administrators
- **Key Features**:
  - Granular permission system
  - Admin level hierarchy
  - Activity tracking and audit logs
  - Approval workflow management

## 🏨 Service Models

### 1. Property Model (Accommodations)
```prisma
model Property {
  id            String       @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  type          PropertyType // HOTEL, APARTMENT, VILLA, etc.
  // ... location, pricing, amenities, approval status
}
```

**Key Features**:
- **Enhanced Pricing**: Base price, cleaning fees, seasonal pricing, discounts
- **Rich Media**: Images, videos, virtual tours, floor plans
- **Detailed Amenities**: Safety features, accessibility options
- **Approval Workflow**: Pending → Under Review → Approved/Rejected
- **Advanced Availability**: Min/max stay, advance notice, instant booking

### 2. Vehicle Model (Transportation)
```prisma
model Vehicle {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  name            String
  type            VehicleType // CAR, SUV, BUS, BOAT, etc.
  // ... specifications, pricing, documentation
}
```

**Key Features**:
- **Comprehensive Specs**: Engine, transmission, fuel type, mileage
- **Flexible Pricing**: Hourly, daily, weekly, monthly rates
- **Documentation**: Registration, insurance, maintenance records
- **Driver Services**: Optional driver inclusion with language support
- **Service Areas**: Geographic coverage and pickup/delivery

### 3. Tour Model (Experiences)
```prisma
model Tour {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  title           String
  type            TourType // CITY_TOUR, ADVENTURE, CULTURAL, etc.
  // ... details, pricing, scheduling
}
```

**Key Features**:
- **Detailed Itineraries**: JSON-based flexible itinerary system
- **Group Management**: Min/max group sizes, pricing per person/group
- **Scheduling**: Available days, time slots, seasonal availability
- **Requirements**: Age restrictions, fitness levels, equipment needs
- **Multi-language Support**: Guide language capabilities

## 📅 Booking System

### Specialized Booking Models

#### 1. PropertyBooking
- **Guest Management**: Adults, children, infants tracking
- **Pricing Breakdown**: Base price, fees, taxes, discounts
- **Check-in/out**: Flexible timing with actual vs. scheduled tracking
- **Guest Information**: Contact details, special requests

#### 2. VehicleBooking
- **Trip Details**: Pickup/return locations with GPS coordinates
- **Driver Management**: Optional driver assignment
- **Documentation**: Renter license verification
- **Vehicle Condition**: Fuel level, mileage, damage tracking
- **Equipment**: Additional equipment requests

#### 3. TourBooking
- **Participant Management**: Names, ages, dietary requirements
- **Meeting Coordination**: Meeting points, timing, language preferences
- **Group Dynamics**: Adult/child ratios, accessibility needs
- **Experience Tracking**: Actual meeting times, completion status

## 💳 Payment & Financial System

### Enhanced Payment Model
```prisma
model Payment {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  amount          Float
  method          PaymentMethod // CREDIT_CARD, BANK_TRANSFER, etc.
  status          PaymentStatus // PENDING, COMPLETED, FAILED, etc.
  // ... gateway integration, refund handling
}
```

**Features**:
- **Multiple Payment Methods**: Cards, bank transfers, mobile wallets, crypto
- **Gateway Integration**: Flexible integration with Stripe, PayPal, Razorpay
- **Refund Management**: Partial and full refunds with reason tracking
- **Multi-booking Support**: Flexible references to different booking types

## 🔍 Review & Rating System

### Comprehensive Review Model
```prisma
model Review {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  rating          Int      // 1-5 stars overall
  // Category-specific ratings
  cleanlinessRating    Int?
  accuracyRating       Int?
  communicationRating  Int?
  // ... detailed review features
}
```

**Features**:
- **Multi-dimensional Ratings**: Overall + category-specific ratings
- **Rich Content**: Photos, pros/cons lists, detailed comments
- **Verification**: Verified reviews from actual bookings
- **Response System**: Owner/provider response capabilities
- **Moderation**: Flagging and admin review system

## ✅ Approval & Workflow System

### Service Request Model
```prisma
model ServiceRequest {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  type            ServiceType   // PROPERTY, VEHICLE, TOUR, etc.
  status          ApprovalStatus // PENDING, APPROVED, REJECTED, etc.
  // ... request details and workflow tracking
}
```

### Pending Approval Model
```prisma
model PendingApproval {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  itemType        String        // "property", "vehicle", "tour", "profile"
  status          ApprovalStatus
  // ... detailed approval workflow
}
```

**Approval Workflow Features**:
- **Multi-stage Review**: Pending → Under Review → Approved/Rejected
- **Assignment System**: Assign approvals to specific admins
- **Priority Management**: Urgent, High, Medium, Low priority levels
- **Audit Trail**: Complete history of all approval actions
- **Batch Operations**: Bulk approve/reject capabilities

## 📊 Analytics & Business Intelligence

### Analytics Model
```prisma
model Analytics {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  type            String   // "booking", "view", "search", "conversion"
  entity          String   // "property", "vehicle", "tour"
  // ... metrics and context data
}
```

**Tracking Capabilities**:
- **User Behavior**: Views, searches, bookings, conversions
- **Business Metrics**: Revenue, occupancy rates, popular services
- **Geographic Data**: City/country performance analysis
- **Time-based Analytics**: Hourly, daily, monthly, seasonal trends

## 🔧 Supporting Systems

### Document Management
```prisma
model Document {
  id              String       @id @default(auto()) @map("_id") @db.ObjectId
  type            DocumentType // NATIONAL_ID, BUSINESS_LICENSE, etc.
  verified        Boolean @default(false)
  // ... document details and verification
}
```

### Communication System
```prisma
model Message {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  senderId        String   @db.ObjectId
  receiverId      String   @db.ObjectId
  // ... messaging between users
}
```

### Notification System
```prisma
model Notification {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  type            String   // booking_confirmed, payment_received, etc.
  userId          String   @db.ObjectId
  // ... multi-channel notifications
}
```

## 🎯 Key Features & Benefits

### 1. **Role-Based Architecture**
- Clean separation of concerns for different user types
- Specialized data models for each business role
- Flexible permission system for admins

### 2. **Comprehensive Approval System**
- Multi-stage approval workflows
- Priority-based queue management
- Complete audit trails
- Batch processing capabilities

### 3. **Advanced Booking Management**
- Service-specific booking models
- Detailed pricing breakdowns
- Flexible payment handling
- Comprehensive tracking

### 4. **Business Intelligence**
- Real-time analytics tracking
- Performance metrics for all stakeholders
- Geographic and temporal analysis
- Conversion funnel tracking

### 5. **Quality Assurance**
- Multi-dimensional review system
- Document verification workflows
- Service quality monitoring
- Fraud prevention measures

## 📈 Scalability Considerations

### Database Optimization
- **Strategic Indexing**: All frequently queried fields are indexed
- **Compound Indexes**: Multi-field indexes for complex queries
- **Geographic Indexes**: Location-based search optimization
- **Time-based Partitioning**: Ready for date-based partitioning

### Performance Features
- **Flexible JSON Fields**: For complex, evolving data structures
- **Efficient Relationships**: Manual MongoDB relationships for performance
- **Caching Strategy**: Optimized for Redis/Memcached integration
- **Read Replicas**: Schema supports read/write splitting

## 🔒 Security & Compliance

### Data Protection
- **PII Handling**: Proper separation of sensitive data
- **Document Security**: Secure file storage references
- **Audit Trails**: Complete action logging
- **Role-based Access**: Granular permission controls

### Compliance Ready
- **GDPR Compliance**: User data management and deletion
- **Financial Regulations**: Payment and refund tracking
- **Business Compliance**: License and certification tracking
- **Data Retention**: Configurable retention policies

This schema provides a robust foundation for a multi-service booking platform with enterprise-level features, comprehensive approval workflows, and scalable architecture suitable for rapid growth and international expansion.
