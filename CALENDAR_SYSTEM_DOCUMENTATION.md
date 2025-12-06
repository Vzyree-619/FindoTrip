# Calendar-Based Pricing & Availability Management System

## 📋 Overview

A comprehensive calendar-based pricing and availability management system for property owners, similar to Airbnb and Booking.com. This system provides complete control over pricing, availability, and booking restrictions.

---

## ✅ Implementation Status

### Phase 1: Database Schema ✅
- **Models Created:**
  - `RoomAvailability` - Per-date availability and custom pricing
  - `SeasonalPricing` - Seasonal pricing rules with day-of-week filters
  - `SpecialEventPricing` - Event-based pricing multipliers
  - `DiscountRule` - Early bird, last minute, long stay discounts
- **Enums Added:**
  - `PriceAdjustmentType` - PERCENTAGE_INCREASE, PERCENTAGE_DECREASE, FIXED_INCREASE, FIXED_DECREASE, FIXED_PRICE
  - `DiscountType` - EARLY_BIRD, LAST_MINUTE, LONG_STAY, WEEKLY, MONTHLY, CUSTOM

### Phase 2: Calendar Component Library ✅
- **`app/components/calendar/RoomCalendar.tsx`**
  - Interactive 3-month calendar view
  - Color-coded availability status
  - Drag-to-select multiple dates
  - Click to edit individual dates
  - Mobile-responsive design
  - Visual indicators for bookings, custom prices, blocked dates

- **`app/components/calendar/DateEditModal.tsx`**
  - Edit pricing for single/multiple dates
  - Block/unblock dates with reasons
  - Set minimum/maximum stay requirements
  - Apply pricing patterns (recurring, weekdays, weekends)

- **`app/components/calendar/BulkEditModal.tsx`**
  - Bulk price setting
  - Bulk block/unblock
  - Bulk minimum stay setting
  - Copy settings from date ranges

### Phase 3: Property Owner Calendar Dashboard ✅
- **`app/routes/dashboard.provider.properties.$id.rooms.$roomId.availability.tsx`**
  - Full calendar integration
  - Booking statistics
  - Revenue tracking
  - Availability management
  - Real-time updates

### Phase 4: Pricing Calculation Engine ✅
- **`app/lib/pricing.server.ts`**
  - `calculateRoomPrice()` - Calculates price for any date considering all rules
  - `calculateStayPrice()` - Calculates total price for multi-night stays
  - Priority system: Custom prices > Event pricing > Seasonal pricing > Base price
  - Discount application (best discount wins)

- **`app/lib/availability.server.ts`**
  - `checkRoomAvailability()` - Checks availability for date ranges
  - `getMinimumStay()` - Gets minimum stay requirements
  - `getMaximumStay()` - Gets maximum stay requirements
  - `getAvailabilitySummary()` - Detailed availability breakdown

### Phase 5: API Routes ✅
- **`app/routes/api.calendar.$roomId.tsx`** (GET)
  - Returns calendar data for date ranges
  - Includes pricing, availability, bookings
  - Applied rules information

- **`app/routes/api.calendar.update.tsx`** (POST)
  - Update pricing/availability
  - Bulk operations support
  - Actions: setPrice, block, unblock, setMinStay, setMaxStay

- **`app/routes/api.calendar.availability.tsx`** (POST)
  - Update availability records
  - Create/edit/delete availability entries

### Phase 6: Customer-Facing Price Display ✅
- **`app/routes/accommodations_.$id.tsx`** (Updated)
  - Dynamic pricing calculation on property detail page
  - Per-night pricing breakdown
  - Fee breakdown (cleaning, service, taxes)
  - Average price per night
  - Real-time availability checking

### Phase 7: Admin Panel Calendar View ✅
- **`app/routes/admin.properties.$id.calendar.tsx`**
  - Admin can view any property's calendar
  - Override owner's pricing
  - Force-block dates
  - View all revenue data
  - Monitor pricing strategy
  - Admin-only actions

### Phase 8: Mobile Optimization ✅
- **Mobile Features:**
  - Single month view on mobile devices
  - Touch-friendly date selection
  - Responsive modals (bottom sheet style)
  - Simplified navigation
  - Optimized text sizes
  - Swipe-friendly controls

---

## 🎯 Key Features

### For Property Owners:
1. **Visual Calendar Management**
   - See all bookings at a glance
   - Color-coded availability status
   - Quick date editing

2. **Flexible Pricing**
   - Custom prices for specific dates
   - Seasonal pricing rules
   - Event-based pricing
   - Automatic discount application

3. **Availability Control**
   - Block dates for maintenance
   - Set minimum/maximum stay requirements
   - View occupancy rates

4. **Bulk Operations**
   - Select multiple dates
   - Apply changes to date ranges
   - Copy settings between dates

### For Customers:
1. **Accurate Pricing**
   - See exact prices for selected dates
   - Per-night breakdown
   - Transparent fee structure

2. **Real-time Availability**
   - Instant availability checking
   - Minimum stay enforcement
   - Blocked date visibility

### For Admins:
1. **Full Control**
   - View any property's calendar
   - Override owner settings
   - Force maintenance blocks
   - Revenue monitoring

---

## 📁 File Structure

```
app/
├── components/
│   └── calendar/
│       ├── RoomCalendar.tsx          # Main calendar component
│       ├── DateEditModal.tsx         # Single/multiple date editor
│       └── BulkEditModal.tsx         # Bulk operations modal
├── lib/
│   ├── pricing.server.ts             # Price calculation engine
│   └── availability.server.ts        # Availability checker
├── routes/
│   ├── dashboard.provider.properties.$id.rooms.$roomId.availability.tsx
│   ├── accommodations_.$id.tsx       # Customer-facing property page
│   ├── admin.properties.$id.calendar.tsx
│   └── api/
│       ├── calendar.$roomId.tsx      # GET calendar data
│       ├── calendar.update.tsx       # POST updates
│       └── calendar.availability.tsx # POST availability
prisma/
└── schema.prisma                     # Database schema
```

---

## 🔧 Usage Guide

### For Property Owners

#### Setting Custom Prices:
1. Navigate to: `/dashboard/provider/properties/{id}/rooms/{roomId}/availability`
2. Click on a date or select multiple dates
3. Choose "Set Custom Price"
4. Enter price and save

#### Creating Seasonal Pricing:
1. Go to property settings
2. Navigate to "Pricing Rules"
3. Click "Create Seasonal Pricing"
4. Set date range, adjustment type, and value
5. Optionally filter by days of week

#### Blocking Dates:
1. Select date(s) on calendar
2. Click "Block Dates"
3. Choose reason (Maintenance, Personal Use, etc.)
4. Add notes if needed

#### Setting Minimum Stay:
1. Click on date(s)
2. In edit modal, set "Minimum Stay"
3. Save changes

### For Customers

#### Viewing Prices:
1. Visit property detail page
2. Select check-in and check-out dates
3. View detailed pricing breakdown:
   - Per-night prices
   - Subtotal
   - Fees (cleaning, service, taxes)
   - Total amount
   - Average per night

### For Admins

#### Viewing Property Calendar:
1. Navigate to: `/admin/properties/{id}/calendar`
2. Select room type
3. View calendar with admin override capabilities
4. Can override any pricing or availability setting

---

## 🧪 Testing Checklist

### Calendar Display ✅
- [x] Shows correct prices for each date
- [x] Shows availability status
- [x] Shows bookings
- [x] Color coding works correctly
- [x] Navigation works (prev/next month)
- [x] Mobile responsive

### Date Editing ✅
- [x] Can click date to edit
- [x] Can select multiple dates
- [x] Can set custom price
- [x] Can block/unblock dates
- [x] Can set minimum stay
- [x] Changes save correctly

### Pricing Rules ✅
- [x] Database models created
- [x] API endpoints ready
- [ ] UI for creating seasonal pricing (to be implemented)
- [ ] UI for creating event pricing (to be implemented)
- [ ] UI for creating discounts (to be implemented)
- [x] Rules apply correctly in calculation engine
- [x] Priority system works

### Price Calculation ✅
- [x] Base price calculates correctly
- [x] Custom prices override correctly
- [x] Seasonal pricing applies
- [x] Event pricing applies
- [x] Discounts apply correctly
- [x] Multiple rules work together

### Customer-Facing ✅
- [x] Customers see correct prices
- [x] Prices match calendar settings
- [x] Unavailable dates show as unavailable
- [x] Price breakdown is accurate
- [x] Minimum stay enforced

### Bulk Actions ✅
- [x] Can select multiple dates
- [x] Bulk price change works
- [x] Bulk block works
- [x] Bulk unblock works

---

## 🚀 Performance Optimizations

1. **Caching:** Calendar data can be cached for frequently accessed properties
2. **Lazy Loading:** Only load visible months initially
3. **Optimistic UI:** Instant feedback on user actions
4. **Batch Operations:** Process multiple dates in single API call

---

## 🔒 Security

1. **Ownership Verification:** All operations verify property ownership
2. **Admin Override:** Admin actions are logged
3. **Input Validation:** All dates and prices are validated
4. **Rate Limiting:** API endpoints should have rate limiting

---

## 📱 Mobile Optimization

- Single month view on mobile (< 768px)
- Touch-friendly date cells
- Responsive modals (95vw width on mobile)
- Simplified navigation
- Optimized text sizes
- Swipe gestures for month navigation

---

## 🐛 Known Limitations

1. **Pricing Rules UI:** Full UI for creating seasonal/event pricing rules needs to be built
2. **Recurring Patterns:** Advanced recurring patterns (e.g., "every 2nd Friday") not yet implemented
3. **Revenue Projections:** Advanced revenue forecasting not yet implemented
4. **Calendar Integration:** iCal/Google Calendar export not yet implemented

---

## 🔮 Future Enhancements

1. **Advanced Recurring Patterns**
   - Every Nth day of month
   - Complex day-of-week patterns
   - Holiday-based rules

2. **Revenue Analytics**
   - Revenue projections
   - Occupancy forecasting
   - Pricing optimization suggestions

3. **Automation**
   - Auto-adjust pricing based on demand
   - Smart blocking suggestions
   - Competitor price monitoring

4. **Integrations**
   - iCal/Google Calendar sync
   - Channel manager integration
   - Booking.com/Airbnb sync

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review code comments in implementation files
3. Check database schema in `prisma/schema.prisma`
4. Review API endpoints in `app/routes/api/calendar/`

---

## 📝 Notes

- All dates are stored in UTC
- Prices are stored as floats (consider using Decimal for production)
- Availability calculations consider existing bookings
- Pricing rules have priority system (custom > event > seasonal > base)
- Admin actions are logged for audit trail

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ Production Ready (Core Features)

