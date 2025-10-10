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

  // Create a dedicated tour guide for our 10 tours
  const tourGuideUser2 = await prisma.user.create({
    data: { 
      email: "mountain.guide@findotrip.com", 
      password: passwordHash, 
      name: "Mountain Adventure Guide", 
      role: "TOUR_GUIDE", 
      verified: true 
    }
  });

  const mountainGuide = await prisma.tourGuide.create({
    data: {
      userId: tourGuideUser2.id,
      firstName: "Ahmed",
      lastName: "Hassan",
      dateOfBirth: new Date("1985-03-15"),
      nationality: "Pakistani",
      yearsOfExperience: 15,
      languages: ["English", "Urdu", "Balti", "Shina"],
      specializations: ["Adventure Tours", "Cultural Tours", "Photography Tours", "Wildlife Tours"],
      certifications: ["First Aid", "Mountain Rescue", "Wildlife Photography"],
      serviceAreas: ["Skardu", "Hunza", "Gilgit", "Shigar", "Deosai"],
      pricePerPerson: 75,
      verified: true,
      documentsSubmitted: ["TOUR_GUIDE_LICENSE", "FIRST_AID_CERTIFICATE"],
      workingHours: "06:00-20:00",
      businessPhone: "+92 300 1234567",
      businessEmail: "ahmed@mountainadventures.com",
    }
  });

  // Tours
  console.log("🗺️  Creating 10 diverse tours...");
  
  const tours = [
    {
      title: "K2 Base Camp Trek - Ultimate Adventure",
      description: "Experience the world's most challenging trek to K2 Base Camp. This 15-day expedition takes you through some of the most spectacular mountain scenery on Earth, including Concordia, the 'Throne Room of the Mountain Gods'.",
      type: "ADVENTURE" as const,
      category: "Adventure",
      duration: 360, // 15 days
      groupSize: 8,
      maxGroupSize: 12,
      difficulty: "challenging",
      city: "Skardu",
      country: "Pakistan",
      meetingPoint: "Skardu Airport",
      pricePerPerson: 2500,
      inclusions: ["Professional Guide", "Porter Services", "Camping Equipment", "All Meals", "Permits", "Transportation"],
      exclusions: ["International Flights", "Personal Gear", "Travel Insurance"],
      requirements: ["High Altitude Experience", "Physical Fitness", "Medical Certificate"],
      recommendations: ["Warm Clothing", "Hiking Boots", "Camera"],
      images: ["/khaplu.jpg", "/deosai.jpg"],
      languages: ["English", "Urdu"],
      availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      timeSlots: ["06:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.9,
      reviewCount: 45,
      totalBookings: 25,
    },
    {
      title: "Hunza Valley Cultural Heritage Tour",
      description: "Discover the rich cultural heritage of Hunza Valley, known as the 'Shangri-La of Pakistan'. Visit ancient forts, meet local communities, and experience traditional Balti culture.",
      type: "CULTURAL" as const,
      category: "Cultural",
      duration: 8,
      groupSize: 6,
      maxGroupSize: 15,
      difficulty: "easy",
      city: "Hunza",
      country: "Pakistan",
      meetingPoint: "Hunza Valley Hotel",
      pricePerPerson: 150,
      inclusions: ["Expert Guide", "Transportation", "Lunch", "Entrance Fees", "Cultural Activities"],
      exclusions: ["Accommodation", "Dinner", "Personal Expenses"],
      requirements: ["Comfortable Walking Shoes"],
      recommendations: ["Camera", "Sun Hat", "Water Bottle"],
      images: ["/himmel.jpg", "/legend.jpg"],
      languages: ["English", "Urdu", "Balti"],
      availableDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
      timeSlots: ["09:00", "14:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.8,
      reviewCount: 128,
      totalBookings: 89,
    },
    {
      title: "Deosai Plains Wildlife Safari",
      description: "Explore the 'Land of Giants' - Deosai National Park, home to the endangered Himalayan brown bear and stunning alpine meadows. Perfect for wildlife photography and nature lovers.",
      type: "NATURE" as const,
      category: "Wildlife",
      duration: 12,
      groupSize: 4,
      maxGroupSize: 8,
      difficulty: "moderate",
      city: "Skardu",
      country: "Pakistan",
      meetingPoint: "Skardu City Center",
      pricePerPerson: 300,
      inclusions: ["Wildlife Guide", "4WD Vehicle", "Binoculars", "Lunch", "Park Entry", "Photography Tips"],
      exclusions: ["Accommodation", "Personal Camera Equipment"],
      requirements: ["Warm Clothing", "Good Physical Condition"],
      recommendations: ["Telephoto Lens", "Binoculars", "Notebook"],
      images: ["/deosai.jpg"],
      languages: ["English", "Urdu"],
      availableDays: ["TUESDAY", "THURSDAY", "SATURDAY"],
      timeSlots: ["06:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.7,
      reviewCount: 67,
      totalBookings: 42,
    },
    {
      title: "Baltit Fort & Altit Fort Historical Tour",
      description: "Step back in time with a guided tour of the ancient Baltit and Altit Forts in Hunza. Learn about the rich history, architecture, and royal heritage of the Hunza Kingdom.",
      type: "HISTORICAL" as const,
      category: "Historical",
      duration: 6,
      groupSize: 8,
      maxGroupSize: 20,
      difficulty: "easy",
      city: "Hunza",
      country: "Pakistan",
      meetingPoint: "Baltit Fort Entrance",
      pricePerPerson: 80,
      inclusions: ["Historical Guide", "Fort Entry Fees", "Traditional Tea", "Cultural Stories"],
      exclusions: ["Transportation", "Meals"],
      requirements: ["Comfortable Shoes"],
      recommendations: ["Camera", "Notebook"],
      images: ["/shigerFort.jpg"],
      languages: ["English", "Urdu", "Balti"],
      availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
      timeSlots: ["10:00", "15:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.6,
      reviewCount: 94,
      totalBookings: 156,
    },
    {
      title: "Shigar Valley Photography Workshop",
      description: "Capture the stunning beauty of Shigar Valley with professional photography guidance. Learn landscape photography techniques while exploring ancient villages and mountain vistas.",
      type: "PHOTOGRAPHY" as const,
      category: "Photography",
      duration: 10,
      groupSize: 6,
      maxGroupSize: 10,
      difficulty: "moderate",
      city: "Shigar",
      country: "Pakistan",
      meetingPoint: "Shigar Fort",
      pricePerPerson: 200,
      inclusions: ["Professional Photographer Guide", "Camera Equipment", "Transportation", "Lunch", "Photo Editing Tips"],
      exclusions: ["Personal Camera", "Accommodation"],
      requirements: ["Basic Photography Knowledge", "DSLR or Mirrorless Camera"],
      recommendations: ["Tripod", "Extra Batteries", "Memory Cards"],
      images: ["/shigerlack.jpg", "/shigerFort.jpg"],
      languages: ["English", "Urdu"],
      availableDays: ["TUESDAY", "THURSDAY", "SATURDAY"],
      timeSlots: ["07:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.9,
      reviewCount: 38,
      totalBookings: 28,
    },
    {
      title: "Skardu Food & Culture Walking Tour",
      description: "Taste your way through Skardu's culinary scene while learning about local culture. Sample traditional Balti dishes, visit local markets, and meet local artisans.",
      type: "FOOD_TOUR" as const,
      category: "Food",
      duration: 4,
      groupSize: 8,
      maxGroupSize: 15,
      difficulty: "easy",
      city: "Skardu",
      country: "Pakistan",
      meetingPoint: "Skardu Main Bazaar",
      pricePerPerson: 60,
      inclusions: ["Food Guide", "All Food Tastings", "Market Tour", "Cultural Stories", "Recipe Cards"],
      exclusions: ["Drinks", "Personal Shopping"],
      requirements: ["Appetite for Adventure"],
      recommendations: ["Comfortable Walking Shoes", "Camera"],
      images: ["/razaqi.jpg"],
      languages: ["English", "Urdu", "Balti"],
      availableDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      timeSlots: ["10:00", "16:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.8,
      reviewCount: 112,
      totalBookings: 203,
    },
    {
      title: "Concordia - Throne Room of Mountain Gods",
      description: "Journey to Concordia, the most spectacular mountain amphitheater in the world. Witness the convergence of four 8000m peaks including K2, Broad Peak, Gasherbrum I & II.",
      type: "ADVENTURE",
      category: "Adventure",
      duration: 240, // 10 days
      groupSize: 6,
      maxGroupSize: 10,
      difficulty: "challenging",
      city: "Skardu",
      country: "Pakistan",
      meetingPoint: "Skardu Airport",
      pricePerPerson: 1800,
      inclusions: ["Expert Mountain Guide", "Porter Services", "Camping Equipment", "All Meals", "Permits", "Transportation"],
      exclusions: ["International Flights", "Personal Gear", "Travel Insurance"],
      requirements: ["High Altitude Experience", "Excellent Physical Fitness", "Medical Certificate"],
      recommendations: ["Professional Camera", "Warm Gear", "Hiking Boots"],
      images: ["/khaplu.jpg"],
      languages: ["English", "Urdu"],
      availableDays: ["MONDAY", "FRIDAY"],
      timeSlots: ["05:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.9,
      reviewCount: 23,
      totalBookings: 18,
    },
    {
      title: "Hunza Cherry Blossom Festival Tour",
      description: "Experience the magical Hunza Cherry Blossom Festival during spring. Witness the valley transform into a pink paradise with cultural performances, local crafts, and traditional music.",
      type: "CULTURAL" as const,
      category: "Cultural",
      duration: 8,
      groupSize: 10,
      maxGroupSize: 20,
      difficulty: "easy",
      city: "Hunza",
      country: "Pakistan",
      meetingPoint: "Hunza Valley Center",
      pricePerPerson: 120,
      inclusions: ["Cultural Guide", "Festival Entry", "Traditional Lunch", "Cultural Performances", "Local Crafts Workshop"],
      exclusions: ["Accommodation", "Personal Shopping"],
      requirements: ["Comfortable Walking Shoes"],
      recommendations: ["Camera", "Traditional Attire"],
      images: ["/himmel.jpg"],
      languages: ["English", "Urdu", "Balti"],
      availableDays: ["SATURDAY", "SUNDAY"],
      timeSlots: ["09:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.7,
      reviewCount: 89,
      totalBookings: 134,
    },
    {
      title: "Shigar Lake Kayaking Adventure",
      description: "Paddle through the crystal-clear waters of Shigar Lake surrounded by towering mountains. Perfect for adventure seekers looking for a unique water experience in the mountains.",
      type: "ADVENTURE",
      category: "Adventure",
      duration: 6,
      groupSize: 4,
      maxGroupSize: 8,
      difficulty: "moderate",
      city: "Shigar",
      country: "Pakistan",
      meetingPoint: "Shigar Lake",
      pricePerPerson: 180,
      inclusions: ["Kayaking Equipment", "Safety Gear", "Professional Guide", "Lunch", "Photography"],
      exclusions: ["Accommodation", "Personal Items"],
      requirements: ["Basic Swimming Skills", "Physical Fitness"],
      recommendations: ["Waterproof Camera", "Swimwear", "Sunscreen"],
      images: ["/shigerlack.jpg"],
      languages: ["English", "Urdu"],
      availableDays: ["TUESDAY", "THURSDAY", "SATURDAY"],
      timeSlots: ["08:00", "14:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.8,
      reviewCount: 56,
      totalBookings: 41,
    },
    {
      title: "Skardu Night Sky Stargazing Tour",
      description: "Discover the pristine night sky of Skardu with professional astronomy guidance. Learn about constellations, planets, and enjoy the clearest views of the Milky Way away from city lights.",
      type: "NATURE" as const,
      category: "Nature",
      duration: 4,
      groupSize: 8,
      maxGroupSize: 15,
      difficulty: "easy",
      city: "Skardu",
      country: "Pakistan",
      meetingPoint: "Skardu Observatory",
      pricePerPerson: 90,
      inclusions: ["Astronomy Guide", "Telescope Access", "Hot Drinks", "Star Chart", "Photography Tips"],
      exclusions: ["Transportation", "Dinner"],
      requirements: ["Warm Clothing"],
      recommendations: ["Camera with Night Mode", "Binoculars", "Blanket"],
      images: ["/deosai.jpg"],
      languages: ["English", "Urdu"],
      availableDays: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"],
      timeSlots: ["20:00"],
      guideId: mountainGuide.id,
      approvalStatus: "APPROVED",
      available: true,
      rating: 4.9,
      reviewCount: 73,
      totalBookings: 67,
    }
  ];

  // Create all tours
  for (const tourData of tours) {
    await prisma.tour.create({
      data: tourData
    });
  }

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
