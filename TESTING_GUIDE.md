# Testing Guide - Room Management System

## Quick Test Scenarios

### Scenario 1: Property Owner Adds Room Type

**Steps:**
1. Login as property owner
2. Navigate to `/dashboard/provider`
3. Select a property
4. Go to Rooms section
5. Click "Add New Room Type"
6. Fill form:
   - Name: "Deluxe King Room"
   - Description: "Spacious room with king bed, city view, and modern amenities"
   - Base Price: 149
   - Bed Type: King
   - Max Occupancy: 2
   - Total Units: 10
   - Upload at least 1 image
   - Select amenities
7. Click "Publish Room Type"

**Expected Result:**
- Room appears in room list
- Property total rooms count increases
- Room is available for booking

---

### Scenario 2: Customer Searches and Books Room

**Steps:**
1. Go to `/accommodations` or `/search`
2. Enter search criteria:
   - Location: Any city
   - Check-in: Tomorrow
   - Check-out: 3 days later
   - Guests: 2 adults
3. View search results
4. Click on a property with rooms
5. Go to "Rooms" tab
6. Select a room type
7. Click "Select This Room"
8. Fill booking form
9. Complete booking

**Expected Result:**
- Search shows properties with available rooms
- Property detail shows all room types
- Selected room shows correct pricing
- Booking creates successfully
- Room availability decreases

---

### Scenario 3: Admin Approves Property with Rooms

**Steps:**
1. Login as admin
2. Navigate to `/admin/approvals/services`
3. Find a property with room types
4. Expand property details
5. Review room information
6. Check approval checklist:
   - Property details complete ✓
   - Property images high quality ✓
   - At least ONE room type added ✓
   - All room types have images ✓
   - Room prices are reasonable ✓
   - Room descriptions are clear ✓
7. Click "Approve"

**Expected Result:**
- Property and all rooms are approved
- Property becomes available for booking
- Owner receives notification

---

### Scenario 4: Property Owner Manages Availability

**Steps:**
1. Login as property owner
2. Navigate to property rooms
3. Click "Manage Availability" on a room
4. View booking calendar
5. Check statistics:
   - Total bookings
   - This month bookings
   - Total revenue
   - Average rate
6. Block a date if needed

**Expected Result:**
- Calendar shows all bookings
- Statistics are accurate
- Blocked dates prevent new bookings

---

## Automated Test Cases

### Unit Tests (To Implement)

```typescript
// Test getPropertyStartingPrice
describe('getPropertyStartingPrice', () => {
  it('should return lowest room price for multi-room property', async () => {
    // Test implementation
  });
  
  it('should return property basePrice if no rooms', async () => {
    // Test implementation
  });
});

// Test checkRoomAvailability
describe('checkRoomAvailability', () => {
  it('should return true when room is available', async () => {
    // Test implementation
  });
  
  it('should return false when room is fully booked', async () => {
    // Test implementation
  });
});

// Test calculateBookingPrice
describe('calculateBookingPrice', () => {
  it('should calculate total correctly', () => {
    // Test implementation
  });
});
```

---

## Manual Testing Checklist

### ✅ Property Cards
- [ ] "Starting from" price displays
- [ ] Price is lowest room price
- [ ] Room types count shows
- [ ] Card is clickable
- [ ] Hover effects work
- [ ] Responsive on mobile

### ✅ Property Detail Page
- [ ] All tabs load correctly
- [ ] Rooms tab shows all room types
- [ ] Date selector works
- [ ] Availability updates when dates change
- [ ] Room cards display correctly
- [ ] Images load properly
- [ ] "Select Room" navigates correctly

### ✅ Booking Flow
- [ ] Booking page loads with correct room
- [ ] Pricing breakdown is accurate
- [ ] Guest form validates
- [ ] Booking creates in database
- [ ] Redirects to payment
- [ ] Confirmation shows room details

### ✅ Property Owner Dashboard
- [ ] Room list displays
- [ ] Can add new room
- [ ] Can edit room
- [ ] Can delete room
- [ ] Statistics are accurate
- [ ] Availability calendar works

### ✅ Search & Filters
- [ ] Date filter works
- [ ] Guest filter works
- [ ] Price filter works
- [ ] Only shows available properties
- [ ] Multiple filters combine correctly

### ✅ Admin Panel
- [ ] Shows room information
- [ ] Approval checklist works
- [ ] Can approve property
- [ ] Room validation works

---

## Performance Testing

### Load Testing
- Test with 100+ properties
- Test with 10+ room types per property
- Test search with date filters
- Test availability checking performance

### Stress Testing
- Multiple simultaneous bookings
- Rapid date changes
- Large image uploads

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards
- [ ] Form labels are associated
- [ ] Error messages are clear

---

## Security Testing

- [ ] Property owners can only edit their own properties
- [ ] Unauthorized users cannot access admin routes
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React)
- [ ] CSRF protection (Remix)

---

## Edge Cases

### Test These Scenarios:

1. **No Rooms Added**
   - Property should still display
   - Should show property base price

2. **All Rooms Booked**
   - Should show "Not Available"
   - Should not allow booking

3. **Invalid Dates**
   - Check-out before check-in
   - Past dates
   - Same day check-in/out

4. **Zero Guests**
   - Should default to 1
   - Should validate minimum

5. **Very Large Numbers**
   - Price: 999,999
   - Units: 1000
   - Should handle gracefully

---

## Regression Testing

After any changes, verify:
- [ ] Existing bookings still work
- [ ] Property listings still display
- [ ] Search functionality intact
- [ ] Booking flow complete
- [ ] Admin approval works

---

## Test Data Setup

### Create Test Property with Rooms

```typescript
// Use Prisma Studio or API to create:
1. Property: "Test Hotel"
2. Room Type 1: "Standard Room" - $99/night - 5 units
3. Room Type 2: "Deluxe Room" - $149/night - 3 units
4. Room Type 3: "Suite" - $249/night - 2 units
```

### Create Test Bookings

```typescript
// Create bookings to test availability:
1. Book Standard Room for next week
2. Book Deluxe Room for next month
3. Verify availability updates
```

---

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/OS information
5. Console errors (if any)
6. Network requests (if relevant)

---

**Last Updated**: January 2025
