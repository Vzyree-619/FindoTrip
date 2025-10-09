import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (dev only)
  if (process.env.NODE_ENV !== "production") {
    console.log("🗑️  Cleaning existing data...");
    await prisma.review.deleteMany();
    await prisma.propertyBooking.deleteMany();
    await prisma.vehicleBooking.deleteMany();
    await prisma.tourBooking.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.property.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.tour.deleteMany();
    await prisma.propertyOwner.deleteMany();
    await prisma.vehicleOwner.deleteMany();
    await prisma.tourGuide.deleteMany();
    await prisma.user.deleteMany();
  }

  // Users
  const passwordHash = await bcrypt.hash("password123", 10);
  console.log("👤 Creating users...");

  const customer1 = await prisma.user.create({
    data: { email: "customer@example.com", password: passwordHash, name: "John Doe", role: "CUSTOMER", verified: true }
  });
  const customer2 = await prisma.user.create({
    data: { email: "jane.smith@example.com", password: passwordHash, name: "Jane Smith", role: "CUSTOMER", verified: true }
  });
  const propertyOwnerUser = await prisma.user.create({
    data: { email: "owner@property.com", password: passwordHash, name: "Sunset Properties", role: "PROPERTY_OWNER", verified: true }
  });
  const vehicleOwnerUser = await prisma.user.create({
    data: { email: "owner@vehicles.com", password: passwordHash, name: "Skardu Car Rentals", role: "VEHICLE_OWNER", verified: true }
  });
  const tourGuideUser = await prisma.user.create({
    data: { email: "guide@example.com", password: passwordHash, name: "Ali Khan", role: "TOUR_GUIDE", verified: true }
  });
  const adminUser = await prisma.user.create({
    data: { email: "admin@example.com", password: passwordHash, name: "Admin User", role: "SUPER_ADMIN", verified: true }
  });

  // Provider profiles
  console.log("🏢 Creating provider profiles...");
  const propOwner = await prisma.propertyOwner.create({
    data: {
      userId: propertyOwnerUser.id,
      businessName: "Sunset Properties Ltd.",
      businessType: "company",
      businessPhone: "+92 300 0000000",
      businessEmail: "biz@property.com",
      businessAddress: "Main Bazaar Road",
      businessCity: "Skardu",
      businessState: "GB",
      businessCountry: "Pakistan",
      businessPostalCode: "16300",
      verified: true,
      documentsSubmitted: ["BUSINESS_LICENSE"],
    }
  });

  const vehOwner = await prisma.vehicleOwner.create({
    data: {
      userId: vehicleOwnerUser.id,
      businessName: "Skardu Car Rentals",
      businessType: "company",
      insuranceProvider: "Allied Insurance",
      insurancePolicy: "POL-123456",
      insuranceExpiry: new Date("2026-12-31"),
      businessPhone: "+92 311 1111111",
      businessEmail: "biz@vehicles.com",
      businessAddress: "Airport Road",
      businessCity: "Skardu",
      businessState: "GB",
      businessCountry: "Pakistan",
      drivingLicense: "DL-123456",
      licenseExpiry: new Date("2027-06-30"),
      drivingExperience: 10,
      languages: ["English", "Urdu"],
      verified: true,
      documentsSubmitted: ["BUSINESS_LICENSE", "VEHICLE_REGISTRATION"],
    }
  });

  const guide = await prisma.tourGuide.create({
    data: {
      userId: tourGuideUser.id,
      firstName: "Ali",
      lastName: "Khan",
      dateOfBirth: new Date("1990-01-01"),
      nationality: "Pakistani",
      yearsOfExperience: 12,
      languages: ["English", "Urdu", "Balti"],
      specializations: ["Trekking", "Cultural"],
      certifications: ["First Aid"],
      serviceAreas: ["Skardu", "Shigar"],
      pricePerPerson: 50,
      verified: true,
      documentsSubmitted: ["TOUR_GUIDE_LICENSE"],
      workingHours: "09:00-18:00",
    }
  });

  // Properties
  console.log("🏨 Creating properties...");
  const properties = await prisma.property.createMany({
    data: [
      {
        name: "Al Noor Starlet Hotel",
        description: "Luxurious hotel in the heart of Skardu with stunning mountain views.",
        type: "HOTEL",
        address: "Main Bazaar Road",
        city: "Skardu",
        country: "Pakistan",
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        basePrice: 12000,
        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
        amenities: ["WiFi", "Parking", "Restaurant"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.8,
        reviewCount: 50,
      },
      {
        name: "Legend Hotel",
        description: "Modern hotel with panoramic views of Skardu Valley.",
        type: "HOTEL",
        address: "Airport Road",
        city: "Skardu",
        country: "Pakistan",
        maxGuests: 3,
        bedrooms: 2,
        bathrooms: 1,
        basePrice: 10000,
        images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800"],
        amenities: ["WiFi", "Restaurant"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.6,
        reviewCount: 42,
      },
    ]
  });

  // Vehicles
  console.log("🚗 Creating vehicles...");
  const vehicle1 = await prisma.vehicle.create({
    data: {
      name: "Toyota Land Cruiser V8",
      brand: "Toyota",
      model: "Land Cruiser",
      year: 2022,
      type: "SUV",
      category: "LUXURY",
      description: "Powerful 4x4 perfect for mountain terrain.",
      seats: 7,
      transmission: "AUTOMATIC",
      fuelType: "DIESEL",
      basePrice: 150,
      images: ["https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800"],
      features: ["4x4", "GPS", "AC"],
      location: "Skardu Airport",
      city: "Skardu",
      country: "Pakistan",
      licensePlate: "SKD-1234",
      registrationNo: "REG-123",
      insurancePolicy: "POL-123",
      insuranceExpiry: new Date("2026-12-31"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.7,
      reviewCount: 30,
    }
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      name: "Honda Civic 2023",
      brand: "Honda",
      model: "Civic",
      year: 2023,
      type: "CAR",
      category: "STANDARD",
      description: "Comfortable sedan ideal for city travel.",
      seats: 5,
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      basePrice: 60,
      images: ["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800"],
      features: ["GPS", "AC"],
      location: "City Center",
      city: "Skardu",
      country: "Pakistan",
      licensePlate: "SKD-5678",
      registrationNo: "REG-5678",
      insurancePolicy: "POL-5678",
      insuranceExpiry: new Date("2026-06-30"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.5,
      reviewCount: 18,
    }
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      name: "Suzuki Swift",
      brand: "Suzuki",
      model: "Swift",
      year: 2022,
      type: "CAR",
      category: "ECONOMY",
      description: "Compact hatchback, great fuel economy and city driving.",
      seats: 5,
      transmission: "MANUAL",
      fuelType: "PETROL",
      basePrice: 40,
      images: ["https://images.unsplash.com/photo-1621135802920-133df287f89f?w=800"],
      features: ["AC", "Bluetooth"],
      location: "Lahore",
      city: "Lahore",
      country: "Pakistan",
      licensePlate: "LHR-2022",
      registrationNo: "REG-2022",
      insurancePolicy: "POL-2022",
      insuranceExpiry: new Date("2026-09-30"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.3,
      reviewCount: 12,
    }
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      name: "Toyota Hiace",
      brand: "Toyota",
      model: "Hiace",
      year: 2021,
      type: "VAN",
      category: "VAN",
      description: "Spacious van ideal for group transport and tours.",
      seats: 12,
      transmission: "MANUAL",
      fuelType: "DIESEL",
      basePrice: 90,
      images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"],
      features: ["AC", "Extra Space"],
      location: "Islamabad",
      city: "Islamabad",
      country: "Pakistan",
      licensePlate: "ISB-7788",
      registrationNo: "REG-7788",
      insurancePolicy: "POL-7788",
      insuranceExpiry: new Date("2026-05-15"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.6,
      reviewCount: 22,
    }
  });

  // Tours
  console.log("🗺️  Creating tours...");
  const tour1 = await prisma.tour.create({
    data: {
      title: "Skardu City Cultural Tour",
      description: "Explore the cultural landmarks of Skardu with a local expert.",
      type: "CULTURAL",
      category: "CULTURAL",
      duration: 6,
      groupSize: 10,
      maxGroupSize: 12,
      difficulty: "easy",
      city: "Skardu",
      country: "Pakistan",
      meetingPoint: "City Center",
      pricePerPerson: 25,
      inclusions: ["Guide", "Snacks"],
      exclusions: ["Meals"],
      requirements: [],
      recommendations: [],
      images: ["https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=800"],
      languages: ["English", "Urdu"],
      guideId: guide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.9,
      reviewCount: 20,
    }
  });

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
