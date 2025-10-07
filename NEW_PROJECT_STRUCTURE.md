# FindoTrip - Professional Project Structure

## Overview
This document describes the new, professional folder structure implemented for the FindoTrip project. The structure follows industry best practices and modern web development standards.

---

## Folder Structure

### `/app`
Root application directory containing all application code.

#### `/app/components`
Reusable UI components organized by purpose and domain.

##### `/app/components/common`
Shared, generic components used throughout the application.
- **ErrorBoundary.tsx** - Error boundary wrapper component
- **LazyImage.tsx** - Lazy loading image component
- **LoadingStates.tsx** - Loading and offline indicators
- **SEOHead.tsx** - SEO meta tags and structured data
- **DocumentUpload.tsx** - File upload component
- **util/** - Utility components (Modal, Error, Logo)

##### `/app/components/layout`
Layout and navigation components.
- **Footer.jsx** - Application footer
- **MobileNavigation.tsx** - Mobile navigation menu
- **navigation/** - Navigation components
  - **NavBar.jsx** - Main navigation bar
  - **NavBarWithAuth.tsx** - Authenticated navigation bar
  - **MainHeader.jsx** - Main header component

##### `/app/components/forms`
Form components and input elements.
- **auth/** - Authentication forms
  - **AuthForm.jsx** - Login/register form

##### `/app/components/features`
Feature-specific components organized by domain.

- **home/** - Landing page components
  - AddPage.jsx
  - CarRentalScroll.jsx
  - Faq.jsx
  - InputForm.jsx
  - Register.jsx
  - Stays.jsx
  - SubscriptionForm.jsx
  - TourPackages.jsx

- **accommodations/** - Hotel/property components
  - Priceing.jsx
  - PropertyCard.tsx

- **rooms/** - Room-specific components
  - Apartments.jsx
  - Faq.jsx
  - GuestRooms.jsx
  - HomePage.jsx
  - PopularAttractions.jsx

- **tours/** - Tour-related components
  - Landing.jsx
  - OtherTours.jsx
  - TourSection.jsx

- **blog/** - Blog components
  - AddPage.jsx
  - BlogSection.jsx
  - Landing.jsx

- **vehicles/** - Vehicle rental components
  - carsPage.jsx
  - landing.jsx

- **admin/** - Admin panel components
  - comments.jsx
  - guestReview.jsx
  - traveler.jsx

- **marketing/** - Marketing components
  - PricingPlan.jsx

- **expenses/** - Expense tracking components
  - ChartBar.jsx
  - ExpenseForm.jsx
  - ExpenseListItem.jsx
  - ExpensesList.jsx

---

#### `/app/lib`
Shared libraries and server-side utilities.

##### `/app/lib/auth`
Authentication and authorization utilities.
- **auth.server.ts** - Core auth functions and session management
- **auth.server.js** - Legacy auth utilities
- **auth-strategies.server.ts** - OAuth strategies (Google, Facebook)

##### `/app/lib/db`
Database utilities and connections.
- **db.server.ts** - Prisma client instance
- **database.server.js** - Database helper functions

##### `/app/lib/validations`
Input validation and sanitization.
- **validation.server.ts** - TypeScript validation schemas
- **validation.server.js** - JavaScript validation utilities
- **input.server.js** - Input sanitization

##### `/app/lib/email`
Email sending utilities.
- **email.server.ts** - Email service configuration

##### `/app/lib/api`
API client utilities (future use).

##### `/app/lib/utils`
General utility functions (future use).

---

#### `/app/routes`
Remix route files organized by feature.

##### `/app/routes/api`
API endpoint routes.
- booking.cancel.tsx
- booking.confirm.tsx
- booking.create.tsx
- search.accommodations.tsx
- upload-document.tsx

##### `/app/routes/_layouts`
Layout wrapper routes.
- Layout.jsx

##### `/app/routes/blogs`
Blog-related routes.
- $id.jsx - Individual blog post
- index.jsx - Blog listing

##### `/app/routes/car_rentals`
Car rental routes.
- index.jsx

##### `/app/routes/dashboard`
User dashboard routes.
- user/index.jsx

##### `/app/routes/rooms`
Room-related routes.
- $id.jsx - Room details
- $type.jsx - Rooms by type
- index.jsx - Room listing

##### `/app/routes/tours`
Tour-related routes.
- $id.jsx - Tour details
- index.jsx - Tour listing

##### Tour Guide Routes
- tour-guide.dashboard.tsx
- tour-guide.tours.tsx
- tour-guide.tours.new.tsx
- tour-guide.bookings.tsx
- tour-guide.profile.tsx
- tour-guide.schedule.tsx

##### Authentication Routes
- login.tsx
- logout.tsx
- logout-now.tsx
- register.tsx
- register.customer.tsx
- register.property-owner.tsx
- register.tour-guide.tsx
- register.vehicle-owner.tsx
- forgot-password.tsx
- reset-password.tsx

##### Dashboard Routes
- dashboard.tsx - Main dashboard
- dashboard.bookings.tsx
- dashboard.favorites.tsx
- dashboard.profile.tsx
- dashboard.provider.tsx
- dashboard.reviews.tsx
- dashboard.guide.tsx

##### Other Routes
- _index.jsx - Home page
- accommodations.search.tsx
- accommodations.$id.tsx
- book.stay.id.tsx
- booking.confirmation.$id.tsx
- booking.guest-details.tsx
- booking.payment.tsx
- HotelDetails.jsx
- stays.id.tsx
- profile.tsx
- privacy.tsx
- terms.tsx
- offline.tsx
- $.tsx - 404 page
- robots[.]txt.tsx
- sitemap[.]xml.tsx

---

#### `/app/features`
Feature modules for domain-driven development (future use).
- auth/
- booking/
- tour-guide/
- dashboard/
- property-owner/
- customer/

---

#### `/app/contexts`
React Context providers.
- **BookingContext.tsx** - Booking state management

---

#### `/app/hooks`
Custom React hooks.
- **useAccessibility.ts** - Accessibility utilities
- **useNetwork.ts** - Network status detection

---

#### `/app/types`
TypeScript type definitions.
- models/ - Database model types
- api/ - API response types
- common/ - Shared types

---

#### `/app/config`
Configuration files.
- **paths.ts** - Centralized import path configuration

---

#### `/app/utils`
Utility functions.
- formatters/ - Data formatting utilities
- validators/ - Validation utilities
- helpers/ - Helper functions

---

#### `/app/styles`
Global CSS files.
- **shared.css** - Shared styles
- **expenses.css** - Expense module styles
- **marketing.css** - Marketing styles
- **tailwind.css** - Tailwind CSS imports

---

## Import Path Guidelines

### Using Absolute Imports
All imports should use the `~/` prefix for absolute paths from the app directory:

```typescript
// ✅ Good - Absolute imports
import { Button } from "~/components/common/Button";
import { getUser } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

// ❌ Bad - Relative imports
import { Button } from "../../components/common/Button";
import { getUser } from "../lib/auth/auth.server";
```

### Component Imports
```typescript
// Common components
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import { LazyImage } from "~/components/common/LazyImage";

// Layout components
import NavBar from "~/components/layout/navigation/NavBarWithAuth";
import Footer from "~/components/layout/Footer";

// Feature components
import InputForm from "~/components/features/home/InputForm";
import PropertyCard from "~/components/features/accommodations/PropertyCard";

// Forms
import AuthForm from "~/components/forms/auth/AuthForm";
```

### Library Imports
```typescript
// Auth
import { getUser, requireUserId } from "~/lib/auth/auth.server";
import { authenticator } from "~/lib/auth/auth-strategies.server";

// Database
import { prisma } from "~/lib/db/db.server";

// Validations
import { validateInput } from "~/lib/validations/validation.server";

// Email
import { sendEmail } from "~/lib/email/email.server";
```

### Hook Imports
```typescript
import { useAccessibility } from "~/hooks/useAccessibility";
import { useNetwork } from "~/hooks/useNetwork";
```

### Context Imports
```typescript
import { BookingProvider } from "~/contexts/BookingContext";
```

---

## Benefits of New Structure

### 1. **Better Organization**
- Components are grouped by purpose (common, layout, features)
- Easy to find related files
- Clear separation of concerns

### 2. **Scalability**
- Each feature has its own folder
- Easy to add new features without cluttering
- Modular architecture supports growth

### 3. **Maintainability**
- Consistent import paths
- Centralized utilities
- Clear naming conventions

### 4. **Developer Experience**
- Intuitive folder structure
- Easier onboarding for new developers
- Better IDE autocomplete

### 5. **Performance**
- Easier to implement code splitting
- Clear boundaries for lazy loading
- Optimized import paths

---

## Migration Checklist

- [x] Create new folder structure
- [x] Move components to appropriate locations
- [x] Reorganize library files
- [x] Update all import statements
- [x] Organize routes by feature
- [x] Create path configuration
- [x] Update documentation
- [x] Test all imports
- [x] Verify application builds

---

## Next Steps

### 1. **Feature Modules**
Gradually migrate related code into feature modules:
```
app/features/booking/
  ├── components/
  ├── hooks/
  ├── utils/
  ├── types/
  └── index.ts
```

### 2. **Type Definitions**
Add comprehensive TypeScript types:
```
app/types/
  ├── models/
  │   ├── User.ts
  │   ├── Booking.ts
  │   └── Property.ts
  ├── api/
  │   ├── requests.ts
  │   └── responses.ts
  └── common/
      └── index.ts
```

### 3. **API Clients**
Create organized API clients:
```
app/lib/api/
  ├── booking.ts
  ├── properties.ts
  ├── tours.ts
  └── users.ts
```

### 4. **Utilities**
Add utility functions:
```
app/utils/
  ├── formatters/
  │   ├── date.ts
  │   ├── currency.ts
  │   └── string.ts
  ├── validators/
  │   ├── email.ts
  │   └── phone.ts
  └── helpers/
      ├── array.ts
      └── object.ts
```

---

## Coding Standards

### File Naming
- **Components**: PascalCase (e.g., `NavBar.tsx`)
- **Utilities**: camelCase (e.g., `auth.server.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Styles**: kebab-case (e.g., `shared.css`)

### Import Order
1. React and third-party imports
2. Internal absolute imports (~/)
3. Relative imports (if necessary)
4. Style imports

Example:
```typescript
// 1. React and third-party
import { useState } from "react";
import { Link } from "@remix-run/react";

// 2. Internal absolute imports
import { Button } from "~/components/common/Button";
import { getUser } from "~/lib/auth/auth.server";

// 3. Relative imports (avoid when possible)
import { helper } from "./utils";

// 4. Styles
import styles from "./styles.css";
```

---

## Troubleshooting

### Import Errors
If you encounter import errors:
1. Check the file has been moved to the correct location
2. Verify the import path uses `~/` prefix
3. Ensure TypeScript paths are configured in `tsconfig.json`

### Build Errors
If the application fails to build:
1. Clear node_modules and reinstall: `npm ci`
2. Clear build cache: `npm run clean` (if available)
3. Check for circular dependencies

### IDE Issues
If IDE doesn't recognize imports:
1. Restart TypeScript server
2. Check `.vscode/settings.json` for path configuration
3. Verify `tsconfig.json` paths configuration

---

## Resources

- [Remix Documentation](https://remix.run/docs)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated**: October 2025
**Version**: 2.0

