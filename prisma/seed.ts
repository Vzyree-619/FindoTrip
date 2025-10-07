import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== "production") {
    console.log("🗑️  Cleaning existing data...");
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.unavailableDate.deleteMany();
    await prisma.guideAvailability.deleteMany();
    await prisma.tourGuide.deleteMany();
    await prisma.car.deleteMany();
    await prisma.accommodation.deleteMany();
    await prisma.user.deleteMany();
  }

  // ============================================================================
  // Create Users
  // ============================================================================
  console.log("👤 Creating users...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const customer1 = await prisma.user.create({
    data: {
      email: "customer@example.com",
      password: passwordHash,
      name: "John Doe",
      role: "CUSTOMER",
      phone: "+1234567890",
      verified: true,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      password: passwordHash,
      name: "Jane Smith",
      role: "CUSTOMER",
      phone: "+1234567891",
      verified: true,
    },
  });

  const carProvider = await prisma.user.create({
    data: {
      email: "carprovider@example.com",
      password: passwordHash,
      name: "Car Rental Co.",
      role: "CAR_PROVIDER",
      phone: "+1234567892",
      verified: true,
    },
  });

  const tourGuideUser = await prisma.user.create({
    data: {
      email: "guide@example.com",
      password: passwordHash,
      name: "Ali Khan",
      role: "TOUR_GUIDE",
      phone: "+1234567893",
      verified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: passwordHash,
      name: "Admin User",
      role: "ADMIN",
      phone: "+1234567894",
      verified: true,
    },
  });

  console.log(`✅ Created ${5} users`);

  // ============================================================================
  // Create Accommodations
  // ============================================================================
  console.log("🏨 Creating accommodations...");

  const accommodations = await Promise.all([
    prisma.accommodation.create({
      data: {
        name: "Al Noor Starlet Hotel",
        description: "Luxurious hotel in the heart of Skardu with stunning mountain views. Features modern amenities, comfortable rooms, and excellent service.",
        type: "HOTEL",
        address: "Main Bazaar Road, Skardu",
        city: "Skardu",
        country: "Pakistan",
        latitude: 35.2971,
        longitude: 75.6339,
        pricePerNight: 120,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
          "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800",
        ],
        amenities: ["WiFi", "Parking", "Restaurant", "Room Service", "Mountain View"],
        rating: 9.5,
        reviewCount: 50,
        ownerId: admin.id,
      },
    }),
    prisma.accommodation.create({
      data: {
        name: "Sehrish Guest House",
        description: "Cozy guest house offering traditional Pakistani hospitality. Perfect for budget-conscious travelers seeking authentic experiences.",
        type: "HOSTEL",
        address: "Old Town, Skardu",
        city: "Skardu",
        country: "Pakistan",
        latitude: 35.2873,
        longitude: 75.6384,
        pricePerNight: 40,
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        images: [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        ],
        amenities: ["WiFi", "Breakfast", "Garden"],
        rating: 8.3,
        reviewCount: 65,
        ownerId: admin.id,
      },
    }),
    prisma.accommodation.create({
      data: {
        name: "Legend Hotel",
        description: "Modern hotel with panoramic views of Skardu Valley. Equipped with all modern facilities and a rooftop restaurant.",
        type: "HOTEL",
        address: "Airport Road, Skardu",
        city: "Skardu",
        country: "Pakistan",
        latitude: 35.3215,
        longitude: 75.6876,
        pricePerNight: 100,
        maxGuests: 3,
        bedrooms: 2,
        bathrooms: 1,
        images: [
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
        ],
        amenities: ["WiFi", "Parking", "Restaurant", "Gym", "Laundry"],
        rating: 9.2,
        reviewCount: 42,
        ownerId: admin.id,
      },
    }),
    prisma.accommodation.create({
      data: {
        name: "Himmel Resort",
        description: "Exclusive resort in Shigar Valley with breathtaking views of Karakoram mountains. Perfect for nature lovers and adventure seekers.",
        type: "RESORT",
        address: "Shigar Valley",
        city: "Shigar",
        country: "Pakistan",
        latitude: 35.4265,
        longitude: 75.7346,
        pricePerNight: 350,
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 3,
        images: [
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
          "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
        ],
        amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Bar", "Concierge", "Mountain View"],
        rating: 9.8,
        reviewCount: 28,
        ownerId: admin.id,
      },
    }),
    prisma.accommodation.create({
      data: {
        name: "Mountain View Villa",
        description: "Spacious villa with private garden and stunning mountain views. Ideal for families and groups.",
        type: "VILLA",
        address: "Satpara Lake Road",
        city: "Skardu",
        country: "Pakistan",
        latitude: 35.2654,
        longitude: 75.6198,
        pricePerNight: 200,
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        ],
        amenities: ["WiFi", "Parking", "Kitchen", "Garden", "BBQ Area", "Mountain View"],
        rating: 9.0,
        reviewCount: 15,
        ownerId: admin.id,
      },
    }),
  ]);

  console.log(`✅ Created ${accommodations.length} accommodations`);

  // ============================================================================
  // Create Cars
  // ============================================================================
  console.log("🚗 Creating cars...");

  const cars = await Promise.all([
    prisma.car.create({
      data: {
        name: "Toyota Land Cruiser V8",
        brand: "Toyota",
        model: "Land Cruiser",
        year: 2022,
        type: "SUV",
        description: "Powerful 4x4 perfect for mountain terrain. Comfortable for long journeys with ample space.",
        pricePerDay: 150,
        seats: 7,
        transmission: "AUTOMATIC",
        fuelType: "DIESEL",
        images: [
          "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800",
        ],
        features: ["4x4", "GPS", "AC", "Bluetooth", "Backup Camera"],
        location: "Skardu Airport",
        city: "Skardu",
        country: "Pakistan",
        latitude: 35.3353,
        longitude: 75.5360,
        licensePlate: "SKD-1234",
        insuranceExpiry: new Date("2026-12-31"),
        rating: 4.8,
        reviewCount: 32,
        providerId: carProvider.id,
      },
    }),
    prisma.car.create({
      data: {
        name: "Honda Civic 2023",
        brand: "Honda",
        model: "Civic",
        year: 2023,
        type: "Sedan",
        description: "Comfortable sedan ideal for city travel and highway cruising.",
        pricePerDay: 60,
        seats: 5,
        transmission: "AUTOMATIC",
        fuelType: "PETROL",
        images: [
          "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800",
        ],
        features: ["GPS", "AC", "Bluetooth", "USB Charging"],
        location: "City Center",
        city: "Skardu",
        country: "Pakistan",
        latitude: 35.2971,
        longitude: 75.6339,
        licensePlate: "SKD-5678",
        insuranceExpiry: new Date("2026-06-30"),
        rating: 4.5,
        reviewCount: 18,
        providerId: carProvider.id,
      },
    }),
  ]);

  console.log(`✅ Created ${cars.length} cars`);

  // ============================================================================
  // Create Tour Guide
  // ============================================================================
  console.log("🗺️  Creating tour guide...");

  const tourGuide = await prisma.tourGuide.create({
    data: {
      userId: tourGuideUser.id,
      bio: "Experienced mountaineer and guide with 10+ years of experience in Karakoram region. Specialized in trekking, mountaineering expeditions, and cultural tours. Fluent in multiple languages.",
      languages: ["English", "Urdu", "Balti", "Chinese"],
      specialties: ["Mountaineering", "Trekking", "Cultural Tours", "Photography Tours"],
      experience: 12,
      pricePerHour: 50,
      city: "Skardu",
      country: "Pakistan",
      rating: 4.9,
      reviewCount: 67,
      toursCompleted: 250,
      certifications: ["Mountain Guide Certification", "First Aid Certified"],
    },
  });

  console.log(`✅ Created tour guide profile`);

  // ============================================================================
  // Create Sample Bookings
  // ============================================================================
  console.log("📅 Creating sample bookings...");

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        bookingNumber: `BK${Date.now()}001`,
        userId: customer1.id,
        accommodationId: accommodations[0].id,
        checkIn: new Date("2025-11-15"),
        checkOut: new Date("2025-11-18"),
        guests: 2,
        totalPrice: 360,
        status: "CONFIRMED",
        specialRequests: "Late check-in requested",
      },
    }),
    prisma.booking.create({
      data: {
        bookingNumber: `BK${Date.now()}002`,
        userId: customer2.id,
        carId: cars[0].id,
        checkIn: new Date("2025-12-01"),
        checkOut: new Date("2025-12-05"),
        guests: 4,
        totalPrice: 600,
        status: "PENDING",
      },
    }),
  ]);

  console.log(`✅ Created ${bookings.length} bookings`);

  // ============================================================================
  // Create Sample Reviews
  // ============================================================================
  console.log("⭐ Creating sample reviews...");

  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: customer1.id,
        bookingId: bookings[0].id,
        accommodationId: accommodations[0].id,
        rating: 5,
        comment: "Excellent hotel with amazing mountain views! Staff was very helpful and the rooms were spotlessly clean.",
      },
    }),
  ]);

  console.log(`✅ Created ${reviews.length} reviews`);

  console.log("✨ Database seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
