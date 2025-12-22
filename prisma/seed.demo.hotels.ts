import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Minimal helper to clamp numbers
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

// Placeholder gallery images (ensure at least 8 per property/room)
const stockImages = [
  "https://images.unsplash.com/photo-1501117716987-c8e1ecb210af",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
  "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
  "https://images.unsplash.com/photo-1505761671935-60b3a7427bad",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
  "https://images.unsplash.com/photo-1505691938895-83b9e0c473b3",
  "https://images.unsplash.com/photo-1505691938895-46d7feb511aa",
  "https://images.unsplash.com/photo-1505761671935-1234a7427bad",
];

const hotels = [
  { name: "Emerald Heights Hotel", city: "Islamabad", country: "Pakistan" },
  { name: "Cedar Grove Inn", city: "Lahore", country: "Pakistan" },
  { name: "Marina Bay Residences", city: "Karachi", country: "Pakistan" },
  { name: "Highland Peak Resort", city: "Murree", country: "Pakistan" },
  { name: "Silk Route Lodge", city: "Skardu", country: "Pakistan" },
  { name: "Hunza Terrace Suites", city: "Hunza", country: "Pakistan" },
  { name: "Desert Pearl Hotel", city: "Bahawalpur", country: "Pakistan" },
  { name: "Valley View Retreat", city: "Swat", country: "Pakistan" },
  { name: "Coastal Breeze Boutique", city: "Gwadar", country: "Pakistan" },
  { name: "Pearl Continental Demo", city: "Multan", country: "Pakistan" },
];

const roomTemplates = [
  {
    name: "Standard King",
    description: "Bright 28 m² room with king bed, desk, fast Wi-Fi, smart TV.",
    maxGuests: 2,
    beds: 1,
    bedType: "King",
    basePrice: 12000,
  },
  {
    name: "Twin Deluxe",
    description: "Spacious 32 m² twin with seating area, city view, blackout shades.",
    maxGuests: 3,
    beds: 2,
    bedType: "Twin",
    basePrice: 14000,
  },
  {
    name: "Family Suite",
    description: "48 m² suite with 1 king + 2 twins, kitchenette, dining nook.",
    maxGuests: 4,
    beds: 3,
    bedType: "King + Twin",
    basePrice: 18000,
  },
];

const amenityPool = [
  "Free Wi‑Fi",
  "Breakfast included",
  "Air conditioning",
  "Heating",
  "Smart TV",
  "Mini fridge",
  "Coffee maker",
  "Work desk",
  "In-room safe",
  "Hair dryer",
  "Iron & board",
  "Room service",
  "Laundry service",
  "24/7 front desk",
  "Airport shuttle",
  "Free parking",
  "Gym access",
  "Pool access",
  "Spa access",
];

const featurePool = [
  "City view",
  "Mountain view",
  "Garden view",
  "Soundproofing",
  "Balcony (select rooms)",
  "Kitchenette (suites)",
  "Blackout curtains",
  "Hardwood floors",
  "Rain shower",
];

async function main() {
  console.log("🌱 Seeding 10 demo hotels with rooms and owners (dev-safe, no wipes)");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const owners = await Promise.all(
    hotels.map((hotel, idx) =>
      prisma.user.upsert({
        where: { email: `owner${idx + 1}@demo-hotel.com` },
        update: {},
        create: {
          email: `owner${idx + 1}@demo-hotel.com`,
          password: passwordHash,
          name: `${hotel.name} Owner`,
          role: "PROPERTY_OWNER",
          verified: true,
          phone: `+92 30${clamp(10000000 + idx * 1234, 3000000000, 3099999999)}`,
        },
      })
    )
  );

  const ownerProfiles = await Promise.all(
    owners.map((user, idx) =>
      prisma.propertyOwner.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          businessName: hotels[idx].name,
          businessType: "company",
          businessPhone: user.phone || "",
          businessEmail: user.email,
          businessAddress: "Demo Street 123",
          businessCity: hotels[idx].city,
          businessState: "",
          businessCountry: hotels[idx].country,
          businessPostalCode: "00000",
          verified: true,
          documentsSubmitted: ["BUSINESS_LICENSE"],
        },
      })
    )
  );

  for (let i = 0; i < hotels.length; i++) {
    const hotel = hotels[i];
    const ownerProfile = ownerProfiles[i];

    const property = await prisma.property.create({
      data: {
        name: hotel.name,
        description: `${hotel.name} is a comfortable, well-reviewed stay in ${hotel.city} offering modern rooms, attentive staff, and convenient access to local attractions.`,
        type: "HOTEL",
        address: "Demo Street 123",
        city: hotel.city,
        state: "",
        country: hotel.country,
        postalCode: "00000",
        latitude: 33.6844,
        longitude: 73.0479,
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 4,
        basePrice: 12000,
        cleaningFee: 800,
        serviceFee: 600,
        taxRate: 8,
        currency: "PKR",
        images: stockImages.slice(0, 8),
        videos: [],
        virtualTour: null,
        floorPlan: null,
        amenities: ["Free Wi‑Fi", "Breakfast included", "Parking", "Gym", "Pool"],
        propertyFacilities: ["Front desk 24/7", "Elevator", "CCTV", "Generator backup"],
        safetyFeatures: ["Smoke detectors", "Fire extinguishers", "First aid kit"],
        accessibility: ["Wheelchair accessible entrance", "Elevator"],
        houseRules: ["No parties", "No loud noise after 10pm"],
        starRating: 4,
        ownerId: ownerProfile.id,
        approvalStatus: "APPROVED",
        rating: 4.6,
        reviewCount: 32,
        totalBookings: 120,
        viewCount: 500,
        favoriteCount: 40,
      },
    });

    // Create 3 room types per property
    for (let r = 0; r < roomTemplates.length; r++) {
      const tmpl = roomTemplates[r];
      const images = stockImages.slice(r, r + 4);
      const amenities = amenityPool.slice(0, 8 + r);
      const features = featurePool.slice(0, 5 + r);

      await prisma.roomType.create({
        data: {
          propertyId: property.id,
          name: tmpl.name,
          description: tmpl.description,
          maxOccupancy: tmpl.maxGuests,
          adults: tmpl.maxGuests,
          numberOfBeds: tmpl.beds,
          bedType: tmpl.bedType,
          bedConfiguration: `${tmpl.beds} ${tmpl.bedType}`,
          roomSize: 28 + r * 6,
          roomSizeUnit: "m²",
          basePrice: tmpl.basePrice + i * 300,
          weekendPrice: tmpl.basePrice + i * 300 + 1200,
          discountPercent: 5 + r * 2,
          specialOffer: r === 2 ? "Suite upgrade offer" : null,
          totalUnits: 3 + r,
          images,
          mainImage: images[0],
          amenities,
          features,
          smokingAllowed: false,
          petsAllowed: r === 2,
          available: true,
          currency: "PKR",
        } as any,
      });
    }
  }

  console.log("✅ Demo hotels seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

