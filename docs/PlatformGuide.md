# FindoTrip Platform Guide

This guide documents key routes, features, flows and how to verify the multi‑service booking platform works end‑to‑end.

## Overview
- Services: Accommodations (properties), Vehicles (car rentals), Tours (local experiences)
- Tech: Remix + Prisma + MongoDB; unified green (`#01502E`) and orange palette
- User flows: Browse → Detail page → Booking widget → Booking page → Payment → Confirmation

## Clean Routes
- Properties: `/property/:id` (alias to `accommodations.$id.tsx`)
- Vehicles: `/vehicle/:id` (alias to `vehicles.$id.tsx`)
- Tours: `/tour/:id` (alias to `tours.$id.tsx`)
- Booking:
  - Property: `app/routes/book/property.$id.tsx`
  - Vehicle: `app/routes/book/vehicle.$id.tsx`
  - Tour: `app/routes/book/tour.$id.tsx`
  - Payment: `app/routes/book/payment.$id.tsx`
  - Confirmation: `app/routes/book/confirmation.$id.tsx`

## Detail Pages (Full Page)
All detail pages are full‑page (no modal expansions) and include:
- Header: Breadcrumbs, Title (H1), Location, Rating (+ count), Save/Share
- Gallery: Hero image + thumbnails; lightbox viewing on click
- Host/Guide/Owner card: photo, verification, rating, languages/contact
- Information: rich description + highlights + inclusions + exclusions
- Specs: Duration/Difficulty/Group size (Tours); Vehicle specs; Property amenities
- Logistics: Meeting/Pickup point; map placeholder; timing instructions
- Policies: What to bring; cancellation/rescheduling
- Reviews: rating breakdown + recent cards; “Show more” if needed
- Similar items: mini‑grid with links to related tours/vehicles/properties

## Booking Widgets (Sticky Sidebar)
- Tours (`tours.$id.tsx`): Date picker, time slots, participants, add‑ons (lunch/photo/equipment), live total, validation, “Book Now”, “Message Guide”, trust badges
- Vehicles (`vehicles.$id.tsx`): Pickup/Dropoff dates, pickup location, insurance/driver options, live total, trust badges, “Book Now”, “Contact Owner”
- Properties (`accommodations.$id.tsx`): Check‑in/Check‑out dates, guests, availability checks, pricing breakdown (base + fees + taxes), “Book Now”

## Booking Pages (Form + Validation)
- Tour: `book/tour.$id.tsx`
  - Loader validates availability; returns pricing breakdown; requires auth
  - Action creates booking; redirects to payment
- Vehicle: `book/vehicle.$id.tsx`
  - Loader validates date range against unavailable dates; computes pricing
  - Action validates, creates PENDING booking, redirects to payment
- Property: `book/property.$id.tsx`
  - Loader validates conflicts/unavailable; computes nights and totals
  - Action validates and returns updated breakdown or creates booking

## Theming & UX
- Palette unified to green `#01502E` and orange accents
- Hover states: subtle scale + shadow; links are accessible
- Cards: Entire card clickable; no intercepts preventing navigation

## Navigation
- Vehicles: `/vehicles` list → card → `/vehicle/:id`
- Tours: `/tours` list → card → `/tour/:id`
- Properties: search/list → card → `/property/:id`
- User menu: “Dashboard” points to `/dashboard/overview` for a stable entry; Profile/Bookings/Wishlist available

## Testing
- Lightweight loader tests (no external framework): `tests/feature.test.ts`
- NPM script: `npm run test:features`
- Covers:
  - Tours list/detail loaders
  - Vehicles list/detail loaders
  - Vehicle booking loader (dates, totals)
- Note: If your environment blocks IPC (EPERM), run tests locally.

## Verification Checklist
1. Build/dev: `npm run dev` (or `npm run build` + `npm start`)
2. Tours: `/tours` → click card → `/tour/:id` full page; try date/time/add‑ons; total updates; Book → Tour booking
3. Vehicles: `/vehicles` → click card → `/vehicle/:id`; Book → vehicle booking page; proceed to payment
4. Properties: `/property/:id` → check dates; Book → property booking page; totals computed
5. Wishlist: Toggle on detail pages; check `/dashboard/favorites`
6. Dashboard: Use dropdown “Dashboard” → `/dashboard/overview` (no redirect loops)
7. Search: Results link to clean paths `/tour/:id`, `/vehicle/:id`, `/property/:id`

## Troubleshooting
- Environment variables:
  - `DATABASE_URL`: MongoDB connection string
  - `SESSION_SECRET`: random 32+ char secret
  - `NODE_ENV`: `development` or `production`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: if using uploads
  - `SENDGRID_API_KEY` or SMTP settings: if using email sending
- Seed data:
  - Run `npm run db:push` then `npm run db:seed` to populate initial data for testing.
- 500 errors on listings: DB fallback data is returned in list pages; check console warnings
- Card clicks don’t navigate: ensure click handlers don’t call `preventDefault`; entire card wrapped in Remix `Link`
- Tests fail in sandbox: run `npm run test:features` locally where IPC is permitted
- Styling inconsistencies: confirm theme classes use green/orange; search for old blue/purple/red styles and replace

## Notes
- Many pages use Prisma relations and computed fields; seed or mock data may be used when DB is not connected
- Payment and confirmation pages expect pre‑created booking IDs
