# Quick Start Guide - Room Management System

## 🚀 Getting Started

### 1. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (if needed)
npx prisma db push
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test the System

#### As Property Owner:
1. Login at `/login`
2. Navigate to `/dashboard/provider`
3. Select a property
4. Go to "Rooms" section: `/dashboard/provider/properties/{propertyId}/rooms`
5. Click "Add New Room Type"
6. Fill in room details and publish

#### As Customer:
1. Go to `/accommodations` or `/search`
2. Enter search criteria (location, dates, guests)
3. Click on a property
4. View room types in "Rooms" tab
5. Select a room and book

#### As Admin:
1. Login as admin
2. Go to `/admin/approvals/services`
3. View properties with room information
4. Approve properties with room validation

---

## 📋 Key Routes

### Property Owner Routes
- `/dashboard/provider` - Main dashboard
- `/dashboard/provider/properties/{id}/rooms` - Room management
- `/dashboard/provider/properties/{id}/rooms/new` - Add room
- `/dashboard/provider/properties/{id}/rooms/{roomId}/edit` - Edit room
- `/dashboard/provider/properties/{id}/rooms/{roomId}/availability` - Availability calendar

### Customer Routes
- `/accommodations` - Search properties
- `/accommodations/{id}` - Property detail with rooms
- `/book/property/{id}` - Booking page

### Admin Routes
- `/admin/approvals/services` - Approve properties with rooms
- `/admin/services/properties` - Manage properties with room info

---

## ✅ Verification Checklist

Run through these to verify everything works:

- [ ] Property owner can add room type
- [ ] Room appears in property detail page
- [ ] Customer can search and see "Starting from" prices
- [ ] Customer can view all room types
- [ ] Customer can select room and book
- [ ] Booking creates with roomTypeId
- [ ] Admin can see rooms during approval
- [ ] Search filters by room availability

---

## 🐛 Common Issues

**Issue**: Rooms not showing
- **Fix**: Check `roomTypes` are included in loader query
- **Fix**: Verify `available: true` on room types

**Issue**: "Starting from" price wrong
- **Fix**: Ensure `getPropertiesWithStartingPrices()` is used
- **Fix**: Check room types have `basePrice` set

**Issue**: Availability not updating
- **Fix**: Verify dates are passed correctly
- **Fix**: Check `filterPropertiesByRoomAvailability()` is called

---

**For detailed documentation, see:**
- `ROOM_MANAGEMENT_DOCUMENTATION.md`
- `IMPLEMENTATION_SUMMARY.md`
- `TESTING_GUIDE.md`

