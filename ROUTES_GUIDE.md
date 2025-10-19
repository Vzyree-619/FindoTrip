# 🗺️ FindoTrip - Routes & Usage Guide

## 📋 **COMPLETE ROUTES REFERENCE**

This guide provides a comprehensive overview of all available routes in the FindoTrip platform and how to use them.

---

## 🏠 **PUBLIC ROUTES**

### **Landing & Discovery**
- **`/`** - Homepage with search form and featured content
- **`/accommodations`** - Property listings with search and filters
- **`/vehicles`** - Vehicle rental listings with search and filters  
- **`/tours`** - Tour experience listings with search and filters
- **`/blogs`** - Blog posts and travel content

### **Service Detail Pages**
- **`/property/:id`** - Individual property details and booking
- **`/vehicle/:id`** - Individual vehicle details and booking
- **`/tour/:id`** - Individual tour details and booking

### **Authentication**
- **`/login`** - User login page
- **`/register`** - User registration page
- **`/forgot-password`** - Password reset request
- **`/reset-password/:token`** - Password reset form
- **`/logout`** - User logout handler

---

## 📖 **BOOKING ROUTES**

### **Booking Flow**
- **`/book/property/:id`** - Property booking form
- **`/book/vehicle/:id`** - Vehicle booking form
- **`/book/tour/:id`** - Tour booking form
- **`/book/payment/:id`** - Payment processing
- **`/book/confirmation/:id`** - Booking confirmation

### **Booking Management**
- **`/bookings`** - User's booking history
- **`/bookings/:id`** - Individual booking details
- **`/bookings/:id/cancel`** - Cancel booking
- **`/bookings/:id/modify`** - Modify booking

---

## 👤 **USER DASHBOARD ROUTES**

### **Customer Dashboard**
- **`/dashboard`** - Main dashboard overview
- **`/dashboard/bookings`** - Booking management
- **`/dashboard/favorites`** - Saved favorites
- **`/dashboard/profile`** - Profile management
- **`/dashboard/settings`** - Account settings
- **`/dashboard/messages`** - Message center

### **Property Owner Dashboard**
- **`/dashboard/provider`** - Property owner dashboard
- **`/dashboard/provider/properties`** - Property management
- **`/dashboard/provider/properties/new`** - Add new property
- **`/dashboard/provider/properties/:id/edit`** - Edit property
- **`/dashboard/provider/bookings`** - Property bookings
- **`/dashboard/provider/analytics`** - Property analytics

### **Vehicle Owner Dashboard**
- **`/dashboard/vehicle-owner`** - Vehicle owner dashboard
- **`/dashboard/vehicle-owner/vehicles`** - Vehicle management
- **`/dashboard/vehicle-owner/vehicles/new`** - Add new vehicle
- **`/dashboard/vehicle-owner/vehicles/:id/edit`** - Edit vehicle
- **`/dashboard/vehicle-owner/bookings`** - Vehicle bookings
- **`/dashboard/vehicle-owner/analytics`** - Vehicle analytics

### **Tour Guide Dashboard**
- **`/dashboard/guide`** - Tour guide dashboard
- **`/dashboard/guide/tours`** - Tour management
- **`/dashboard/guide/tours/new`** - Create new tour
- **`/dashboard/guide/tours/:id/edit`** - Edit tour
- **`/dashboard/guide/bookings`** - Tour bookings
- **`/dashboard/guide/analytics`** - Tour analytics
- **`/dashboard/guide/profile`** - Guide profile
- **`/dashboard/guide/schedule`** - Availability management

---

## 🔧 **ADMIN ROUTES**

### **Main Admin Dashboard**
- **`/admin`** - Admin dashboard overview
- **`/admin/dashboard`** - Platform statistics and metrics

### **User Management**
- **`/admin/users`** - All users management
- **`/admin/users/customers`** - Customer management
- **`/admin/users/providers`** - Provider management
- **`/admin/users/guides`** - Tour guide management
- **`/admin/users/admins`** - Admin user management
- **`/admin/network`** - User network and connections

### **Service Management**
- **`/admin/services/properties`** - Property management
- **`/admin/services/vehicles`** - Vehicle management
- **`/admin/services/tours`** - Tour management
- **`/admin/services/approvals`** - Service approval workflows

### **Booking Management**
- **`/admin/bookings`** - All bookings overview
- **`/admin/bookings/properties`** - Property bookings
- **`/admin/bookings/vehicles`** - Vehicle bookings
- **`/admin/bookings/tours`** - Tour bookings
- **`/admin/bookings/analytics`** - Booking analytics

### **Content Management**
- **`/admin/content`** - Content management overview
- **`/admin/content/moderation`** - Content moderation
- **`/admin/content/media`** - Media file management
- **`/admin/content/blogs`** - Blog content management

### **Review Management**
- **`/admin/reviews`** - Review management overview
- **`/admin/reviews/all`** - All reviews
- **`/admin/reviews/moderation`** - Review moderation
- **`/admin/reviews/flagged`** - Flagged reviews

### **Support System**
- **`/admin/support`** - Support system overview
- **`/admin/support/tickets`** - Support ticket management
- **`/admin/support/conversations`** - All conversations
- **`/admin/support/escalated`** - Escalated issues
- **`/admin/support/analytics`** - Support analytics

### **Analytics & Reporting**
- **`/admin/analytics`** - Platform analytics
- **`/admin/analytics/users`** - User analytics
- **`/admin/analytics/revenue`** - Revenue analytics
- **`/admin/analytics/performance`** - Performance metrics

### **Security & Monitoring**
- **`/admin/security`** - Security monitoring
- **`/admin/security/events`** - Security events
- **`/admin/security/logs`** - Security logs
- **`/admin/security/audit`** - Audit trails

### **Settings & Configuration**
- **`/admin/settings`** - Platform settings
- **`/admin/settings/general`** - General settings
- **`/admin/settings/email`** - Email configuration
- **`/admin/settings/payments`** - Payment settings
- **`/admin/settings/security`** - Security settings

---

## 💬 **COMMUNICATION ROUTES**

### **Messaging System**
- **`/messages`** - Message center
- **`/messages/:conversationId`** - Individual conversation
- **`/messages/new`** - Start new conversation

### **Support Routes**
- **`/support`** - Support center
- **`/support/tickets`** - User support tickets
- **`/support/tickets/new`** - Create new ticket
- **`/support/tickets/:id`** - Individual ticket

---

## 🔍 **SEARCH & FILTER ROUTES**

### **Search Routes**
- **`/search`** - Universal search
- **`/search/properties`** - Property search
- **`/search/vehicles`** - Vehicle search
- **`/search/tours`** - Tour search

### **Filter Routes**
- **`/accommodations?location=...&dates=...`** - Property filters
- **`/vehicles?location=...&dates=...`** - Vehicle filters
- **`/tours?location=...&dates=...`** - Tour filters

---

## 📱 **API ROUTES**

### **Authentication API**
- **`/api/auth/login`** - Login endpoint
- **`/api/auth/register`** - Registration endpoint
- **`/api/auth/logout`** - Logout endpoint
- **`/api/auth/refresh`** - Token refresh

### **Service API**
- **`/api/properties`** - Properties API
- **`/api/vehicles`** - Vehicles API
- **`/api/tours`** - Tours API
- **`/api/bookings`** - Bookings API

### **Search API**
- **`/api/search`** - Universal search API
- **`/api/search/properties`** - Property search API
- **`/api/search/vehicles`** - Vehicle search API
- **`/api/search/tours`** - Tour search API

---

## 🎯 **ROUTE USAGE PATTERNS**

### **Customer Journey**
1. **Discovery**: `/` → `/accommodations` → `/property/:id`
2. **Booking**: `/property/:id` → `/book/property/:id` → `/book/payment/:id`
3. **Management**: `/dashboard` → `/dashboard/bookings` → `/dashboard/profile`

### **Provider Journey**
1. **Registration**: `/register` → `/dashboard/provider`
2. **Service Management**: `/dashboard/provider/properties` → `/dashboard/provider/properties/new`
3. **Booking Management**: `/dashboard/provider/bookings` → `/dashboard/provider/analytics`

### **Admin Journey**
1. **Overview**: `/admin` → `/admin/dashboard`
2. **User Management**: `/admin/users` → `/admin/users/customers`
3. **Service Management**: `/admin/services/properties` → `/admin/services/approvals`
4. **Analytics**: `/admin/analytics` → `/admin/analytics/revenue`

---

## 🔐 **ACCESS CONTROL**

### **Public Access**
- Landing page, service listings, detail pages
- Authentication pages (login, register, forgot password)
- Search and discovery pages

### **Authenticated Users**
- User dashboard and profile management
- Booking management and history
- Messaging and communication features

### **Service Providers**
- Provider-specific dashboards
- Service management (properties, vehicles, tours)
- Booking management and analytics

### **Admin Users**
- Full admin panel access
- User and service management
- Analytics and reporting
- System configuration

---

## 📊 **ROUTE ORGANIZATION**

### **File Structure**
```
app/routes/
├── _index.tsx                 # Homepage
├── login.tsx                  # Login
├── register.tsx               # Registration
├── accommodations.tsx         # Property listings
├── vehicles.tsx               # Vehicle listings
├── tours.tsx                  # Tour listings
├── property.$id.tsx           # Property details
├── vehicle.$id.tsx            # Vehicle details
├── tour.$id.tsx               # Tour details
├── book/                      # Booking routes
├── dashboard/                 # User dashboards
├── admin/                     # Admin routes
├── api/                       # API routes
└── support/                   # Support routes
```

### **Route Conventions**
- **`:id`** - Dynamic route parameters
- **`$`** - Remix route parameters (e.g., `$id.tsx`)
- **`_`** - Layout routes (e.g., `_index.tsx`)
- **Nested routes** - Folder-based routing

---

## 🚀 **QUICK START GUIDE**

### **For Customers**
1. Visit `/` to browse services
2. Use `/accommodations`, `/vehicles`, or `/tours` to find services
3. Click on service cards to view details
4. Use booking forms to make reservations
5. Manage bookings in `/dashboard`

### **For Providers**
1. Register and verify your account
2. Access your dashboard at `/dashboard/provider`
3. Add services using the management tools
4. Handle bookings and track earnings

### **For Admins**
1. Access admin panel at `/admin`
2. Monitor platform activity and users
3. Manage services and bookings
4. Review analytics and reports

---

## 📝 **ROUTE NOTES**

- All routes are **mobile-responsive**
- **Authentication required** for dashboard and booking routes
- **Role-based access** controls what users can see
- **SEO-optimized** URLs for better search visibility
- **Error handling** for invalid routes and permissions
- **Loading states** for better user experience

This comprehensive route guide covers all available functionality in the FindoTrip platform!
