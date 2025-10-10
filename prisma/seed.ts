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
  
  // Data Management User for content management
  const dataManagerUser = await prisma.user.create({
    data: { 
      email: "data@findotrip.com", 
      password: passwordHash, 
      name: "Content Manager", 
      role: "SUPER_ADMIN", 
      verified: true 
    }
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
        images: ["/alnoor.png"],
        amenities: ["WiFi", "Parking", "Restaurant", "AC", "Room Service"],
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
        images: ["/legend.jpg"],
        amenities: ["WiFi", "Restaurant", "AC"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.6,
        reviewCount: 42,
      },
      {
        name: "Sehrish Guest House",
        description: "Cozy guest house with traditional Balti architecture and warm hospitality.",
        type: "GUESTHOUSE",
        address: "Shigar Road",
        city: "Skardu",
        country: "Pakistan",
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        basePrice: 8000,
        images: ["/razaqi.jpg"],
        amenities: ["WiFi", "Parking", "Kitchen", "Garden"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.4,
        reviewCount: 35,
      },
      {
        name: "Himmel Resort",
        description: "Luxury resort in Shigar with breathtaking views of the Karakoram mountains.",
        type: "RESORT",
        address: "Shigar Valley",
        city: "Shigar",
        country: "Pakistan",
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        basePrice: 25000,
        images: ["/himmel.jpg"],
        amenities: ["WiFi", "Parking", "Restaurant", "Spa", "Pool", "Gym"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.9,
        reviewCount: 28,
      },
      {
        name: "Sukoon Resort",
        description: "Peaceful resort by the lake with modern amenities and traditional charm.",
        type: "RESORT",
        address: "Lake View Road",
        city: "Skardu",
        country: "Pakistan",
        maxGuests: 10,
        bedrooms: 5,
        bathrooms: 4,
        basePrice: 18000,
        images: ["/sukoonREsord.jpg"],
        amenities: ["WiFi", "Parking", "Restaurant", "Lake View", "Boat Rides"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.7,
        reviewCount: 41,
      },
      {
        name: "Shiger Fort Hotel",
        description: "Historic hotel in the ancient Shiger Fort with cultural heritage experience.",
        type: "BOUTIQUE_HOTEL",
        address: "Shiger Fort",
        city: "Shigar",
        country: "Pakistan",
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        basePrice: 15000,
        images: ["/shigerFort.jpg"],
        amenities: ["WiFi", "Historic Setting", "Cultural Tours", "Traditional Meals"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.5,
        reviewCount: 22,
      },
      {
        name: "Shiger Lake Lodge",
        description: "Lakeside lodge with stunning views and fishing opportunities.",
        type: "LODGE",
        address: "Shiger Lake",
        city: "Shigar",
        country: "Pakistan",
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        basePrice: 12000,
        images: ["/shigerlack.jpg"],
        amenities: ["WiFi", "Lake Access", "Fishing", "Boat House", "BBQ Area"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.6,
        reviewCount: 18,
      },
      {
        name: "Deosai Plains Camp",
        description: "Adventure camp in the Deosai National Park with tent accommodations.",
        type: "LODGE",
        address: "Deosai National Park",
        city: "Skardu",
        country: "Pakistan",
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 2,
        basePrice: 6000,
        images: ["/deosai.jpg"],
        amenities: ["Camping", "Nature Tours", "Wildlife Viewing", "Hiking"],
        ownerId: propOwner.id,
        approvalStatus: "APPROVED",
        available: true,
        rating: 4.3,
        reviewCount: 15,
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
      basePrice: 25000,
      currency: 'PKR',
      images: ["/landCruser.png"],
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
      basePrice: 15000,
      currency: 'PKR',
      images: ["/car.jpg"],
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
      basePrice: 8000,
      currency: 'PKR',
      images: ["/car.jpg"],
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
      basePrice: 12000,
      currency: 'PKR',
      images: ["/van.jpg"],
      features: ["AC", "Extra Space", "GPS"],
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

  // Add more vehicles to match car rental section
  const vehicle5 = await prisma.vehicle.create({
    data: {
      name: "Toyota Prado",
      brand: "Toyota",
      model: "Prado",
      year: 2022,
      type: "SUV",
      category: "LUXURY",
      description: "Premium SUV perfect for mountain adventures and luxury travel.",
      seats: 7,
      transmission: "AUTOMATIC",
      fuelType: "DIESEL",
      basePrice: 15000,
      currency: 'PKR',
      images: ["/prado.png"],
      features: ["4x4", "GPS", "AC", "Bluetooth", "Backup Camera"],
      location: "Karachi",
      city: "Karachi",
      country: "Pakistan",
      licensePlate: "KHI-2022",
      registrationNo: "REG-2022",
      insurancePolicy: "POL-2022",
      insuranceExpiry: new Date("2026-08-30"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.8,
      reviewCount: 124,
    }
  });

  const vehicle6 = await prisma.vehicle.create({
    data: {
      name: "Toyota Corolla GLI",
      brand: "Toyota",
      model: "Corolla GLI",
      year: 2023,
      type: "CAR",
      category: "STANDARD",
      description: "Reliable sedan with modern features and excellent fuel efficiency.",
      seats: 5,
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      basePrice: 8000,
      currency: 'PKR',
      images: ["/car.jpg"],
      features: ["AC", "GPS", "Bluetooth"],
      location: "Lahore",
      city: "Lahore",
      country: "Pakistan",
      licensePlate: "LHR-2023",
      registrationNo: "REG-2023",
      insurancePolicy: "POL-2023",
      insuranceExpiry: new Date("2026-07-15"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.6,
      reviewCount: 89,
    }
  });

  const vehicle7 = await prisma.vehicle.create({
    data: {
      name: "Honda Civic",
      brand: "Honda",
      model: "Civic",
      year: 2023,
      type: "CAR",
      category: "STANDARD",
      description: "Sporty sedan with advanced technology and comfortable ride.",
      seats: 5,
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      basePrice: 9000,
      currency: 'PKR',
      images: ["/car.jpg"],
      features: ["AC", "GPS", "Bluetooth", "Sunroof"],
      location: "Karachi",
      city: "Karachi",
      country: "Pakistan",
      licensePlate: "KHI-2023",
      registrationNo: "REG-2023",
      insurancePolicy: "POL-2023",
      insuranceExpiry: new Date("2026-09-20"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.5,
      reviewCount: 156,
    }
  });

  const vehicle8 = await prisma.vehicle.create({
    data: {
      name: "Suzuki Swift",
      brand: "Suzuki",
      model: "Swift",
      year: 2022,
      type: "CAR",
      category: "ECONOMY",
      description: "Compact and efficient hatchback perfect for city driving.",
      seats: 5,
      transmission: "MANUAL",
      fuelType: "PETROL",
      basePrice: 6000,
      currency: 'PKR',
      images: ["/car.jpg"],
      features: ["AC", "Bluetooth"],
      location: "Islamabad",
      city: "Islamabad",
      country: "Pakistan",
      licensePlate: "ISB-2022",
      registrationNo: "REG-2022",
      insurancePolicy: "POL-2022",
      insuranceExpiry: new Date("2026-06-10"),
      ownerId: vehOwner.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.4,
      reviewCount: 78,
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
