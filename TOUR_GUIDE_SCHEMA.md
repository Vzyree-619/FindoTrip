# Tour Guide Management System - Database Schema

## New Models to Add to Prisma Schema

```prisma
model TourGuide {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Profile Information
  bio               String?  @db.Text
  experience        Int?     // Years of experience
  specialties       String[] // Array of specialty areas
  languages         String[] // Languages spoken
  certifications    String[] // Certifications and licenses
  
  // Verification
  isVerified        Boolean  @default(false)
  verificationDate  DateTime?
  verificationDocs  String[] // URLs to verification documents
  
  // Business Information
  licenseNumber     String?
  insuranceNumber   String?
  businessName      String?
  
  // Stats
  totalTours        Int      @default(0)
  totalEarnings     Float    @default(0)
  averageRating     Float    @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  tours             Tour[]
  bookings          TourBooking[]
  availability      GuideAvailability[]
  reviews           TourReview[]
}

model Tour {
  id                String   @id @default(uuid())
  guideId           String
  guide             TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  
  // Tour Details
  title             String
  description       String   @db.Text
  itinerary         Json     // Detailed day-by-day itinerary
  
  // Media
  images            String[] // Array of image URLs
  videos            String[] // Array of video URLs
  coverImage        String?
  
  // Pricing
  pricePerPerson    Float
  minGroupSize      Int      @default(1)
  maxGroupSize      Int
  
  // Tour Info
  duration          Int      // Duration in hours
  difficulty        String   // Easy, Moderate, Hard, Expert
  languages         String[] // Languages tour is offered in
  included          String[] // What's included
  excluded          String[] // What's not included
  requirements      String[] // What guests need to bring/have
  
  // Location
  location          String
  meetingPoint      String
  endPoint          String?
  
  // Availability
  isActive          Boolean  @default(true)
  isApproved        Boolean  @default(false)
  approvedAt        DateTime?
  approvedBy        String?
  
  // Seasonal
  availableMonths   Int[]    // Array of month numbers (1-12)
  daysOfWeek        Int[]    // Array of day numbers (0-6, 0=Sunday)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  bookings          TourBooking[]
  reviews           TourReview[]
}

model TourBooking {
  id                String   @id @default(uuid())
  tourId            String
  tour              Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  guideId           String
  guide             TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Booking Details
  tourDate          DateTime
  numberOfGuests    Int
  totalPrice        Float
  
  // Guest Information
  guestNames        String[] // Names of all guests
  guestEmails       String[] // Contact emails
  guestPhones       String[] // Contact phones
  
  // Special Requirements
  specialRequests   String?  @db.Text
  dietaryRestrictions String[]
  accessibilityNeeds String[]
  
  // Status
  status            String   // PENDING, CONFIRMED, CANCELLED, COMPLETED
  paymentStatus     String   // PENDING, PAID, REFUNDED
  
  // Communication
  lastMessageAt     DateTime?
  unreadMessages    Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  payment           Payment?
  review            TourReview?
}

model TourReview {
  id                String   @id @default(uuid())
  tourId            String
  tour              Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  guideId           String
  guide             TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  bookingId         String   @unique
  booking           TourBooking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Review Details
  rating            Int      // 1-5
  title             String?
  comment           String   @db.Text
  
  // Specific Ratings
  knowledgeRating   Int?     // 1-5
  communicationRating Int?   // 1-5
  professionalismRating Int? // 1-5
  valueRating       Int?     // 1-5
  
  // Response
  guideResponse     String?  @db.Text
  responseDate      DateTime?
  
  // Moderation
  isApproved        Boolean  @default(true)
  isReported        Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model GuideAvailability {
  id                String   @id @default(uuid())
  guideId           String
  guide             TourGuide @relation(fields: [guideId], references: [id], onDelete: Cascade)
  
  // Date/Time
  date              DateTime
  startTime         String   // HH:mm format
  endTime           String   // HH:mm format
  
  // Availability
  isAvailable       Boolean  @default(true)
  isBlocked         Boolean  @default(false)
  blockReason       String?
  
  // Recurring
  isRecurring       Boolean  @default(false)
  recurringRule     Json?    // RRULE for recurring availability
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([guideId, date, startTime])
}
```

## Updates to Existing Models

Add to User model:
```prisma
tourGuide         TourGuide?
tourBookings      TourBooking[]
tourReviews       TourReview[]
```

Add to Payment model:
```prisma
tourBookingId     String?  @unique
tourBooking       TourBooking? @relation(fields: [tourBookingId], references: [id])
```

