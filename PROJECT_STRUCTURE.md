# 🏨 FindoTrip - Hotel Booking Platform

## Project Overview
A full-stack hotel booking platform built with Remix, Prisma ORM, and MongoDB. Features multi-service booking (hotels, car rentals, tours) with authentication and role-based access.

---

## 📁 Project Structure

```
FindoTrip/
├── app/
│   ├── components/
│   │   ├── HomePage/          # Landing page components
│   │   │   ├── InputForm.jsx  # Multi-tab search form (Hotel/Car/Tours/Activities)
│   │   │   ├── Stays.jsx      # Hotel listings section
│   │   │   ├── TourPackages.jsx
│   │   │   ├── CarRentalScroll.jsx
│   │   │   ├── AddPage.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Faq.jsx
│   │   │   └── SubscriptionForm.jsx
│   │   ├── navigation/
│   │   │   └── NavBar.jsx     # Responsive navbar with mobile menu
│   │   ├── hotelPages/        # Hotel-related components
│   │   ├── RoomPages/         # Room management components
│   │   ├── carRent/           # Car rental components
│   │   ├── tours/             # Tour guide components
│   │   ├── auth/              # Authentication components
│   │   ├── adminPages/        # Admin dashboard components
│   │   └── Footer.jsx         # Site footer
│   │
│   ├── routes/
│   │   ├── _index.jsx         # Landing page (PRESERVED)
│   │   ├── login.tsx          # Login page
│   │   ├── register.tsx       # Registration page
│   │   ├── logout.tsx         # Logout handler
│   │   ├── rooms/             # Hotel/room routes
│   │   ├── car_rentals/       # Car rental routes
│   │   ├── tours/             # Tour guide routes
│   │   ├── blogs/             # Blog routes
│   │   ├── dashboard/         # User dashboard routes
│   │   ├── dashboard.provider.tsx  # Provider dashboard
│   │   ├── dashboard.guide.tsx     # Tour guide dashboard
│   │   ├── stays.id.tsx       # Hotel details page
│   │   └── book.stay.id.tsx   # Booking page
│   │
│   ├── lib/
│   │   ├── db.server.ts       # Prisma client & database helpers
│   │   └── auth.server.ts     # Authentication utilities
│   │
│   ├── styles/
│   │   ├── shared.css         # Shared styles
│   │   ├── marketing.css      # Marketing page styles
│   │   └── expenses.css       # Expense tracking styles
│   │
│   ├── root.tsx               # Root layout with NavBar
│   └── tailwind.css           # Tailwind styles
│
├── prisma/
│   └── schema.prisma          # Database schema (MongoDB)
│
├── public/
│   ├── FindoTripLogo.png      # Site logo
│   └── landingPageImg.jpg     # Hero image
│
├── .env.example               # Environment variables template
├── package.json               # Dependencies
├── tailwind.config.ts         # Tailwind configuration
└── vite.config.ts             # Vite configuration
```

---

## 🎨 Design System

### Color Palette
- **Primary Green**: `#01502E` (Dark forest green)
- **Accent Green**: `green-500`, `green-600` (Tailwind)
- **Secondary Red**: `red-500` (For secondary actions)
- **Neutral**: Gray scale (Tailwind defaults)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 100-900 (Variable font)

### Component Patterns
- Rounded corners: `rounded`, `rounded-md`, `rounded-lg`
- Shadows: `shadow-md`, `shadow-lg`
- Hover states: Consistent color transitions
- Responsive: Mobile-first with `md:` breakpoints

---

## 🗄️ Database Models

### Core Models
1. **User**
   - Roles: CUSTOMER, CAR_PROVIDER, TOUR_GUIDE, ADMIN
   - Fields: email, password, name, phone, avatar, verified

2. **Accommodation**
   - Types: HOTEL, APARTMENT, VILLA, LODGE, HOSTEL, RESORT
   - Fields: name, description, address, pricePerNight, maxGuests, bedrooms, bathrooms, images, amenities, rating

3. **Car**
   - Fields: name, brand, model, year, type, pricePerDay, seats, transmission, fuelType, images, features, location

4. **TourGuide**
   - Fields: bio, languages, specialties, experience, pricePerHour, city, country, rating, certifications

5. **Booking**
   - Status: PENDING, CONFIRMED, CANCELLED, COMPLETED
   - Fields: bookingNumber, checkIn, checkOut, guests, totalPrice, specialRequests

6. **Payment**
   - Fields: amount, currency, method, transactionId, status

7. **Review**
   - Fields: rating (1-5), comment, userId, bookingId

8. **Wishlist**
   - User favorites for accommodations, cars, and tour guides

---

## 🔐 Authentication System

### Session Management
- Cookie-based sessions (`findotrip_session`)
- 30-day expiration
- HTTP-only, secure in production

### Available Functions (`app/lib/auth.server.ts`)
- `register(email, password, name, role)` - Create new user
- `login(email, password)` - Authenticate user
- `getUser(request)` - Get current user from session
- `requireUserId(request)` - Protect routes (redirect if not logged in)
- `requireRole(request, allowedRoles)` - Role-based access control
- `logout(request)` - Destroy session

### Password Security
- bcryptjs hashing (10 rounds)
- Passwords never stored in plain text

---

## 📊 Database Helper Functions

### Available in `app/lib/db.server.ts`

#### Accommodations
```typescript
getAccommodations(filters?: {
  city, country, type, minPrice, maxPrice, 
  checkIn, checkOut, guests
})
```

#### Cars
```typescript
getCars(filters?: {
  city, country, type, minPrice, maxPrice,
  checkIn, checkOut, seats
})
```

#### Tour Guides
```typescript
getTourGuides(filters?: {
  city, country, language, specialty, maxPrice
})
```

#### Bookings
```typescript
createBooking(data: {
  userId, checkIn, checkOut, guests, totalPrice,
  accommodationId?, carId?, tourGuideId?, specialRequests?
})

getUserBookings(userId: string)
```

#### Reviews
```typescript
createReview(data: {
  userId, bookingId, rating, comment,
  accommodationId?, carId?, tourGuideId?
})
// Auto-updates average ratings
```

#### Provider Stats
```typescript
getProviderStats(providerId: string)
getGuideStats(guideId: string)
```

---

## 🚀 Getting Started

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Add your MongoDB connection string
# DATABASE_URL="mongodb+srv://..."
```

### 2. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to MongoDB (creates collections)
npx prisma db push
```

### 3. Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Key Features

### ✅ Implemented
- [x] Multi-service booking (Hotels, Cars, Tours)
- [x] User authentication with role-based access
- [x] Responsive design (mobile-first)
- [x] Search functionality with filters
- [x] Booking management system
- [x] Review and rating system
- [x] Provider/Guide dashboards
- [x] Wishlist functionality
- [x] Payment tracking
- [x] Availability management

### 🎯 Landing Page Components (PRESERVED)
All existing landing page components are preserved:
- Hero section with search tabs
- Featured stays
- Tour packages showcase
- Car rental carousel
- FAQ section
- Newsletter subscription
- Footer with links

---

## 🛠️ Tech Stack

- **Framework**: Remix (v2.15.3)
- **Database**: MongoDB with Prisma ORM (v6.16.3)
- **Styling**: TailwindCSS (v3.4.17)
- **Authentication**: bcryptjs + cookie sessions
- **Icons**: Lucide React (v0.487.0)
- **Animations**: GSAP (v3.12.7)
- **Image Upload**: Cloudinary (v1.41.3)
- **Date Handling**: date-fns (v4.1.0)

---

## 📝 Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - MongoDB connection string
- `SESSION_SECRET` - Secret for session encryption
- `CLOUDINARY_CLOUD_NAME` - For image uploads
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `NODE_ENV` - development/production

---

## 🎯 Next Steps

### Recommended Development Order:
1. ✅ **Setup Complete** - Database, auth, and helpers ready
2. **Seed Database** - Add sample hotels, cars, and tours
3. **Search Results Pages** - Display filtered results
4. **Detail Pages** - Show individual property/car/guide details
5. **Booking Flow** - Complete reservation process
6. **Payment Integration** - Add payment gateway (Stripe/PayPal)
7. **User Dashboard** - Manage bookings and profile
8. **Provider Dashboard** - Manage listings and bookings
9. **Admin Panel** - Platform management
10. **Testing** - Unit and integration tests

---

## 📚 Useful Commands

```bash
# Prisma
npx prisma studio          # Open database GUI
npx prisma db push         # Sync schema to database
npx prisma generate        # Regenerate Prisma Client

# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run typecheck          # Check TypeScript types
npm run lint               # Run ESLint

# Database Seeding (create this script)
npm run seed               # Populate with sample data
```

---

## 🤝 Contributing

When adding new features:
1. Follow existing component structure
2. Use the established color scheme (#01502E primary)
3. Maintain responsive design patterns
4. Add TypeScript types for new functions
5. Update this documentation

---

## 📞 Support

For issues or questions:
- Check Prisma docs: https://www.prisma.io/docs
- Remix docs: https://remix.run/docs
- MongoDB docs: https://www.mongodb.com/docs

---

**Last Updated**: 2025-10-07
**Version**: 1.0.0
