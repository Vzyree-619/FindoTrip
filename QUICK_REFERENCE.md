# FindoTrip - Quick Reference Guide

## 🚀 Import Cheat Sheet

### Common Components
```typescript
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import { LazyImage } from "~/components/common/LazyImage";
import { LoadingStates, OfflineIndicator, OnlineIndicator } from "~/components/common/LoadingStates";
import { SEOHead, generateMeta } from "~/components/common/SEOHead";
import { DocumentUpload } from "~/components/common/DocumentUpload";

// Utility components
import { Modal } from "~/components/common/util/Modal";
import { Error } from "~/components/common/util/Error";
import { Logo } from "~/components/common/util/Logo";
```

### Layout Components
```typescript
import Footer from "~/components/layout/Footer";
import NavBar from "~/components/layout/navigation/NavBar";
import NavBarWithAuth from "~/components/layout/navigation/NavBarWithAuth";
import MainHeader from "~/components/layout/navigation/MainHeader";
import MobileNavigation from "~/components/layout/MobileNavigation";
```

### Forms
```typescript
import AuthForm from "~/components/forms/auth/AuthForm";
```

### Feature Components

#### Home Page
```typescript
import InputForm from "~/components/features/home/InputForm";
import AddPage from "~/components/features/home/AddPage";
import CarRentalScroll from "~/components/features/home/CarRentalScroll";
import FAQ from "~/components/features/home/Faq";
import Register from "~/components/features/home/Register";
import Stays from "~/components/features/home/Stays";
import SubscriptionForm from "~/components/features/home/SubscriptionForm";
import TourPackages from "~/components/features/home/TourPackages";
```

#### Accommodations
```typescript
import { Pricing } from "~/components/features/accommodations/Priceing";
import { PropertyCard } from "~/components/features/accommodations/PropertyCard";
```

#### Rooms
```typescript
import Apartments from "~/components/features/rooms/Apartments";
import GuestRooms from "~/components/features/rooms/GuestRooms";
import RoomHomePage from "~/components/features/rooms/HomePage";
import PopularAttractions from "~/components/features/rooms/PopularAttractions";
import RoomFAQ from "~/components/features/rooms/Faq";
```

#### Tours
```typescript
import TourLanding from "~/components/features/tours/Landing";
import OtherTours from "~/components/features/tours/OtherTours";
import TourSection from "~/components/features/tours/TourSection";
```

#### Blog
```typescript
import BlogAddPage from "~/components/features/blog/AddPage";
import BlogSection from "~/components/features/blog/BlogSection";
import BlogLanding from "~/components/features/blog/Landing";
```

#### Vehicles
```typescript
import CarsPage from "~/components/features/vehicles/carsPage";
import VehicleLanding from "~/components/features/vehicles/landing";
```

#### Admin
```typescript
import Comments from "~/components/features/admin/comments";
import GuestReview from "~/components/features/admin/guestReview";
import Traveler from "~/components/features/admin/traveler";
```

#### Marketing
```typescript
import PricingPlan from "~/components/features/marketing/PricingPlan";
```

#### Expenses
```typescript
import ChartBar from "~/components/features/expenses/ChartBar";
import ExpenseForm from "~/components/features/expenses/ExpenseForm";
import ExpenseListItem from "~/components/features/expenses/ExpenseListItem";
import ExpensesList from "~/components/features/expenses/ExpensesList";
```

---

## 📚 Library Imports

### Authentication
```typescript
import { getUser, getUserId, requireUserId, createUserSession, logout } from "~/lib/auth/auth.server";
import { authenticator } from "~/lib/auth/auth-strategies.server";
import { hashPassword, verifyPassword, register, login } from "~/lib/auth/auth.server";
import { requireRole, requireCarProvider, requireTourGuide } from "~/lib/auth/auth.server";
import { sessionStorage } from "~/lib/auth/auth.server";
```

### Database
```typescript
import { prisma } from "~/lib/db/db.server";
```

### Validation
```typescript
import { validateInput } from "~/lib/validations/validation.server";
import { validateEmail, validatePassword } from "~/lib/validations/validation.server";
```

### Email
```typescript
import { sendEmail, sendPasswordResetEmail } from "~/lib/email/email.server";
```

---

## 🎣 Hooks

```typescript
import { useAccessibility, SkipToContent, ScreenReaderAnnouncement } from "~/hooks/useAccessibility";
import { useNetwork } from "~/hooks/useNetwork";
```

---

## 🌍 Contexts

```typescript
import { BookingProvider, useBooking } from "~/contexts/BookingContext";
```

---

## 🎨 Styles

```typescript
// In root.tsx or route files
import "~/styles/shared.css";
import "~/styles/expenses.css";
import "~/styles/marketing.css";
import "~/tailwind.css";
```

---

## 📁 File Location Guide

### Where to Put New Files?

#### 🔹 **Reusable Component** (used in 3+ places)
```
app/components/common/YourComponent.tsx
```

#### 🔹 **Layout Component** (navigation, header, footer)
```
app/components/layout/YourComponent.tsx
```

#### 🔹 **Form Component**
```
app/components/forms/YourForm.tsx
```

#### 🔹 **Feature-Specific Component**
```
app/components/features/{feature-name}/YourComponent.tsx
```

#### 🔹 **Route/Page**
```
app/routes/your-route.tsx
app/routes/{feature}/your-route.tsx
```

#### 🔹 **API Endpoint**
```
app/routes/api/your-endpoint.tsx
```

#### 🔹 **Utility Function**
```
app/lib/utils/yourUtility.ts
app/utils/helpers/yourHelper.ts
```

#### 🔹 **Custom Hook**
```
app/hooks/useYourHook.ts
```

#### 🔹 **Context Provider**
```
app/contexts/YourContext.tsx
```

#### 🔹 **TypeScript Type**
```
app/types/models/YourModel.ts    # Database models
app/types/api/YourAPI.ts         # API types
app/types/common/YourType.ts     # Shared types
```

---

## 🔍 Finding Files Quickly

### By Feature
- **Home:** `app/components/features/home/`
- **Accommodations:** `app/components/features/accommodations/`
- **Tours:** `app/components/features/tours/`
- **Vehicles:** `app/components/features/vehicles/`
- **Blog:** `app/components/features/blog/`

### By Type
- **Layout:** `app/components/layout/`
- **Forms:** `app/components/forms/`
- **Common/Utils:** `app/components/common/`
- **Routes:** `app/routes/`
- **API:** `app/routes/api/`

### By Function
- **Auth:** `app/lib/auth/`
- **Database:** `app/lib/db/`
- **Validation:** `app/lib/validations/`
- **Email:** `app/lib/email/`

---

## ⚡ Quick Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
```

### Database
```bash
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio
```

### Code Quality
```bash
npm run lint             # Run linter
npm run format           # Format code
npm run typecheck        # Check TypeScript
```

---

## 🐛 Common Issues & Solutions

### Issue: Import not found
```typescript
// ❌ Wrong
import { Component } from "../../../components/Feature";

// ✅ Correct
import { Component } from "~/components/features/feature/Component";
```

### Issue: Module resolution error
**Solution:** Check Vite config has correct alias:
```typescript
// vite.config.ts
resolve: {
  alias: {
    "~": path.resolve(__dirname, "./app"),
  },
}
```

### Issue: TypeScript can't find module
**Solution:** Restart TS server
- VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

### Issue: Build fails with import error
**Solution:** Ensure extensions are in correct order:
```typescript
extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
```

---

## 📝 Code Style Guidelines

### Import Order
```typescript
// 1. React and external packages
import { useState } from "react";
import { Link } from "@remix-run/react";

// 2. Internal absolute imports
import NavBar from "~/components/layout/navigation/NavBar";
import { getUser } from "~/lib/auth/auth.server";

// 3. Relative imports (avoid when possible)
import { helper } from "./utils";

// 4. Styles
import styles from "./styles.css";
```

### Naming Conventions
- **Components:** PascalCase (`NavBar.tsx`, `PropertyCard.tsx`)
- **Utilities:** camelCase (`auth.server.ts`, `validation.server.ts`)
- **Types:** PascalCase (`User.ts`, `Booking.ts`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`, `useBooking.ts`)
- **Contexts:** PascalCase with `Context` suffix (`AuthContext.tsx`)

---

## 🎯 Best Practices

### ✅ DO
- Use absolute imports with `~/` prefix
- Place reusable components in `common/`
- Organize feature-specific code in `features/`
- Keep imports organized and clean
- Use TypeScript for new files

### ❌ DON'T
- Use relative imports like `../../../`
- Mix feature code with common components
- Create deeply nested folders unnecessarily
- Import from implementation details
- Skip TypeScript types

---

## 📚 Additional Resources

- **Full Documentation:** `NEW_PROJECT_STRUCTURE.md`
- **Restructure Summary:** `RESTRUCTURE_SUMMARY.md`
- **Path Configuration:** `app/config/paths.ts`

---

**Last Updated:** October 7, 2025
**Version:** 2.0.0

