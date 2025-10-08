# 🗄️ Database Utilities Documentation

## Complete File Structure

```
FindoTrip/
├── app/
│   └── lib/
│       ├── db.server.ts           ✅ Prisma client & database helpers
│       ├── auth.server.ts         ✅ Authentication utilities
│       └── validation.server.ts   ✅ NEW - Zod validation schemas
├── prisma/
│   ├── schema.prisma             ✅ Database schema (11 models)
│   └── seed.ts                   ✅ NEW - Sample data seeding
└── package.json                  ✅ UPDATED - Added seed scripts
```

---

## 📚 Table of Contents

1. [Prisma Client & Database Helpers](#prisma-client--database-helpers)
2. [Authentication Utilities](#authentication-utilities)
3. [Validation Schemas](#validation-schemas)
4. [Database Seeding](#database-seeding)
5. [Common Use Cases](#common-use-cases)
6. [Setup & Configuration](#setup--configuration)

---

## 1. Prisma Client & Database Helpers

### Location: `app/lib/db.server.ts`

### ✅ Already Implemented

#### **Prisma Client Setup**
```typescript
import { prisma } from "~/lib/db.server";

// Singleton pattern - reuses connection in development
// Auto-connects and manages connection lifecycle
```

#### **Accommodation Helpers**
```typescript
// Search accommodations with filters
const accommodations = await getAccommodations({
  city: "Skardu",
  country: "Pakistan",
  type: "HOTEL",
  minPrice: 50,
  maxPrice: 200,
  checkIn: new Date("2025-11-15"),
  checkOut: new Date("2025-11-18"),
  guests: 2
});
```

#### **Car Rental Helpers**
```typescript
// Search cars with filters
const cars = await getCars({
  city: "Skardu",
  type: "SUV",
  minPrice: 50,
  maxPrice: 200,
  seats: 7,
  checkIn: new Date("2025-11-15"),
  checkOut: new Date("2025-11-18")
});
```

#### **Tour Guide Helpers**
```typescript
// Search tour guides
const guides = await getTourGuides({
  city: "Skardu",
  language: "English",
  specialty: "Mountaineering",
  maxPrice: 100
});
```

#### **Booking Management**
```typescript
// Create booking
const booking = await createBooking({
  userId: user.id,
  accommodationId: "123",
  checkIn: new Date("2025-11-15"),
  checkOut: new Date("2025-11-18"),
  guests: 2,
  totalPrice: 300,
  specialRequests: "Late check-in"
});

// Get user bookings
const userBookings = await getUserBookings(userId);
```

#### **Review System**
```typescript
// Create review (auto-updates ratings)
const review = await createReview({
  userId: user.id,
  bookingId: booking.id,
  accommodationId: accommodation.id,
  rating: 5,
  comment: "Excellent stay!"
});
// Automatically recalculates average rating
```

#### **Provider/Guide Stats**
```typescript
// Car provider stats
const stats = await getProviderStats(providerId);
// Returns: totalCars, totalBookings, totalRevenue, activeCars

// Tour guide stats
const guideStats = await getGuideStats(guideId);
// Returns: totalTours, upcomingTours, totalRevenue, rating
```

---

## 2. Authentication Utilities

### Location: `app/lib/auth.server.ts`

### ✅ Already Implemented

#### **Session Management**
```typescript
// Create user session (redirect after login)
return await createUserSession(user.id, "/dashboard");

// Get current user session
const session = await getUserSession(request);

// Get user ID from session
const userId = await getUserId(request);

// Require authentication (redirects if not logged in)
const userId = await requireUserId(request);

// Get full user object
const user = await getUser(request);

// Logout user
return await logout(request);
```

#### **Password Security**
```typescript
// Hash password (bcrypt with 10 rounds)
const hashedPassword = await hashPassword("password123");

// Verify password
const isValid = await verifyPassword(inputPassword, storedHash);
```

#### **User Authentication**
```typescript
// Register new user
const result = await register("user@example.com", "password123", "John Doe", "CUSTOMER");
if (result.error) {
  // Handle error: "A user with this email already exists"
}
// Auto-creates TourGuide profile if role is TOUR_GUIDE

// Login user
const result = await login("user@example.com", "password123");
if (result.error) {
  // Handle error: "Invalid email or password"
}
```

#### **Authorization Helpers**
```typescript
// Require specific role
const user = await requireRole(request, ["ADMIN", "CAR_PROVIDER"]);

// Require car provider
const provider = await requireCarProvider(request);

// Require tour guide
const guide = await requireTourGuide(request);
```

---

## 3. Validation Schemas

### Location: `app/lib/validation.server.ts`

### ✅ NEW - Just Created

#### **Available Schemas**

```typescript
// User schemas
createUserSchema
updateUserSchema
loginSchema

// Accommodation schemas
createAccommodationSchema
updateAccommodationSchema
accommodationSearchSchema

// Car schemas
createCarSchema
updateCarSchema

// Tour Guide schemas
createTourGuideSchema
updateTourGuideSchema

// Booking schemas
createBookingSchema
updateBookingSchema

// Review schemas
createReviewSchema

// Payment schemas
createPaymentSchema
```

#### **Usage Example**

```typescript
import { validateSchema, createAccommodationSchema } from "~/lib/validation.server";

// In your route action
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Validate input
  const result = validateSchema(createAccommodationSchema, data);
  
  if (!result.success) {
    return json({ errors: result.errors }, { status: 400 });
  }

  // Type-safe validated data
  const validatedData = result.data;
  
  // Create accommodation
  const accommodation = await prisma.accommodation.create({
    data: {
      ...validatedData,
      ownerId: userId
    }
  });

  return json({ accommodation });
}
```

#### **TypeScript Types**

```typescript
import type { 
  CreateAccommodationInput,
  UpdateAccommodationInput,
  CreateBookingInput 
} from "~/lib/validation.server";

// All validation schemas export corresponding TypeScript types
```

---

## 4. Database Seeding

### Location: `prisma/seed.ts`

### ✅ NEW - Just Created

#### **Sample Data Includes**

- **5 Users**: Customer, Car Provider, Tour Guide, Admin
- **5 Accommodations**: Hotels, Guest Houses, Resorts, Villas
- **2 Cars**: SUV and Sedan
- **1 Tour Guide** with complete profile
- **2 Sample Bookings**
- **1 Sample Review**

#### **Run Seeding**

```bash
# Seed database
npm run db:seed

# Reset database and seed
npm run db:reset

# Push schema and seed
npm run db:push && npm run db:seed
```

#### **Default Credentials**

All seeded users have password: `password123`

```
customer@example.com      - Customer
jane.smith@example.com    - Customer
carprovider@example.com   - Car Provider
guide@example.com         - Tour Guide
admin@example.com         - Admin
```

---

## 5. Common Use Cases

### **User Registration & Login**

```typescript
// Route: app/routes/register.tsx
import { register, createUserSession } from "~/lib/auth.server";
import { validateSchema, createUserSchema } from "~/lib/validation.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Validate
  const validation = validateSchema(createUserSchema, data);
  if (!validation.success) {
    return json({ errors: validation.errors }, { status: 400 });
  }

  // Register
  const result = await register(
    validation.data.email,
    validation.data.password,
    validation.data.name,
    validation.data.role
  );

  if (result.error) {
    return json({ error: result.error }, { status: 400 });
  }

  // Create session and redirect
  return createUserSession(result.user.id, "/dashboard");
}
```

### **Protected Route**

```typescript
// Route: app/routes/dashboard.tsx
import { requireUserId, getUser } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  
  // User is authenticated
  return json({ user });
}
```

### **Search with Validation**

```typescript
// Route: app/routes/accommodations.search.tsx
import { getAccommodations } from "~/lib/db.server";
import { validateSchema, accommodationSearchSchema } from "~/lib/validation.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams);

  // Validate search parameters
  const validation = validateSchema(accommodationSearchSchema, {
    ...searchParams,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    guests: searchParams.guests ? parseInt(searchParams.guests) : undefined,
  });

  if (!validation.success) {
    return json({ accommodations: [], errors: validation.errors });
  }

  // Search with validated params
  const accommodations = await getAccommodations(validation.data);
  
  return json({ accommodations });
}
```

### **Create Booking with Validation**

```typescript
// Route: app/routes/book.tsx
import { createBooking } from "~/lib/db.server";
import { validateSchema, createBookingSchema } from "~/lib/validation.server";
import { requireUserId } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const data = {
    checkIn: new Date(formData.get("checkIn") as string),
    checkOut: new Date(formData.get("checkOut") as string),
    guests: parseInt(formData.get("guests") as string),
    totalPrice: parseFloat(formData.get("totalPrice") as string),
    accommodationId: formData.get("accommodationId") as string,
  };

  // Validate
  const validation = validateSchema(createBookingSchema, data);
  if (!validation.success) {
    return json({ errors: validation.errors }, { status: 400 });
  }

  // Create booking
  const booking = await createBooking({
    userId,
    ...validation.data
  });

  return redirect(`/bookings/${booking.id}`);
}
```

---

## 6. Setup & Configuration

### **Initial Setup**

```bash
# 1. Install dependencies (already done)
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your MongoDB connection string

# 3. Generate Prisma Client
npm run db:generate

# 4. Push schema to database
npm run db:push

# 5. Seed database with sample data
npm run db:seed

# 6. Start development server
npm run dev
```

### **Available Scripts**

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database and reseed
```

### **Environment Variables**

```env
# Required
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/findotrip"
SESSION_SECRET="your-secret-key-change-in-production"

# Optional
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NODE_ENV="development"
```

---

## 🔒 Security Best Practices

### **Already Implemented**

✅ **Password Hashing**: bcryptjs with 10 rounds
✅ **Session Security**: HTTP-only, secure cookies in production
✅ **Input Validation**: Zod schemas for all inputs
✅ **SQL Injection Protection**: Prisma parameterized queries
✅ **Role-Based Access Control**: Authorization helpers

### **Recommendations**

1. **Never commit `.env`** - Already in `.gitignore`
2. **Use strong SESSION_SECRET** - Generate with `openssl rand -base64 32`
3. **Enable CORS** only for trusted origins
4. **Rate limiting** - Add for login/register routes
5. **HTTPS only** in production

---

## 📖 Additional Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Zod Docs**: https://zod.dev
- **Remix Docs**: https://remix.run/docs
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas

---

## ✅ Summary

All database utilities are **production-ready** with:

- ✅ **Type Safety**: Full TypeScript support
- ✅ **Validation**: Zod schemas for all inputs
- ✅ **Authentication**: Complete session management
- ✅ **Authorization**: Role-based access control
- ✅ **Error Handling**: Proper error responses
- ✅ **Sample Data**: Ready-to-use seed file
- ✅ **Documentation**: Complete usage examples

**Your database layer is complete and ready to use!** 🎉
