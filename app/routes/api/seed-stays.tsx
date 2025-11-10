import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

export async function action({ request }: ActionFunctionArgs) {
  const token = request.headers.get('x-seed-token') || '';
  const expected = process.env.SEED_TOKEN || 'dev';
  if (token !== expected) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure a property owner exists
  const ownerEmail = 'owner@example.com';
  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: 'PROPERTY_OWNER', name: 'Demo Owner' },
    create: { email: ownerEmail, password: 'demo1234', name: 'Demo Owner', role: 'PROPERTY_OWNER' as any }
  });

  let ownerProfile = await prisma.propertyOwner.findUnique({ where: { userId: ownerUser.id } });
  if (!ownerProfile) {
    ownerProfile = await prisma.propertyOwner.create({
      data: {
        userId: ownerUser.id,
        businessName: 'Demo Hospitality Co.',
        businessType: 'individual',
        businessLicense: 'LIC-DEMO-001',
        taxId: 'NTN-0001',
        businessPhone: '+92-300-0000000',
        businessEmail: ownerEmail,
        businessAddress: '123 Demo Street',
        businessCity: 'Islamabad',
        businessState: 'ICT',
        businessCountry: 'Pakistan',
        businessPostalCode: '44000',
        verified: true,
      }
    });
  }

  // Wipe previous stays and room types
  await prisma.roomType.deleteMany();
  await prisma.property.deleteMany();

  const cities = [
    { city: 'Skardu', country: 'Pakistan', state: 'GB' },
    { city: 'Shigar', country: 'Pakistan', state: 'GB' },
    { city: 'Hunza', country: 'Pakistan', state: 'GB' },
    { city: 'Islamabad', country: 'Pakistan', state: 'ICT' },
    { city: 'Lahore', country: 'Pakistan', state: 'Punjab' },
    { city: 'Karachi', country: 'Pakistan', state: 'Sindh' },
    { city: 'Murree', country: 'Pakistan', state: 'Punjab' },
    { city: 'Gilgit', country: 'Pakistan', state: 'GB' },
  ];

  const propertyTypes = ['HOTEL', 'APARTMENT', 'VILLA', 'RESORT', 'HOSTEL', 'LODGE', 'BOUTIQUE_HOTEL', 'GUESTHOUSE'] as const;
  const amenitiesPool = ['WiFi', 'Breakfast', 'Air Conditioning', 'Parking', 'Pool', 'Gym', 'TV', 'Room Service', 'Heater', 'Kitchen', 'Lake View', 'Mountain View'];

  const imagePool = ['/alnoor.png', '/legend.jpg', '/himmel.jpg', '/sukoonREsord.jpg', '/shigerFort.jpg', '/shigerlack.jpg', '/deosai.jpg', '/khaplu.jpg', '/awariExpress.jpg', '/two.jpg', '/three.jpg', '/one.jpg'];
  const namePrefixes = ['Sunrise', 'Emerald', 'Oakwood', 'Cedar', 'Blue Sky', 'Golden Peak', 'Valley View', 'Lakeside', 'Mountain Nest', 'Royal'];
  const nameSuffixes = ['Hotel', 'Suites', 'Residency', 'Lodge', 'Inn', 'Resort', 'Guest House', 'Boutique'];

  let created = 0;
  let roomTypesCreated = 0;

  // Generate 12+ properties
  for (let i = 0; i < 12; i++) {
    const loc = cities[i % cities.length];
    const pName = `${pick(namePrefixes)} ${pick(nameSuffixes)} ${loc.city}`;
    const basePrice = 7000 + Math.floor(Math.random() * 12000);
    const type = pick(propertyTypes) as any;
    const images = [pick(imagePool)];
    const amenities = Array.from(new Set([pick(amenitiesPool), pick(amenitiesPool), pick(amenitiesPool), pick(amenitiesPool), pick(amenitiesPool)])).slice(0, 6);

    const prop = await prisma.property.create({
      data: {
        name: pName,
        description: 'Comfortable stay with modern amenities and scenic views.',
        type,
        address: 'Main Road',
        city: loc.city,
        state: loc.state,
        country: loc.country,
        maxGuests: 4 + (i % 4),
        bedrooms: 1 + (i % 3),
        bathrooms: 1 + (i % 2),
        basePrice,
        cleaningFee: Math.round(basePrice * 0.05),
        serviceFee: Math.round(basePrice * 0.08),
        taxRate: 0.02,
        currency: 'PKR',
        weekendPricing: 1.15,
        monthlyDiscount: 5,
        weeklyDiscount: 3,
        images,
        videos: [],
        floorPlan: null,
        amenities,
        safetyFeatures: ['Fire Extinguisher', 'Smoke Detector'],
        accessibility: ['Elevator'],
        houseRules: ['No Smoking', 'No Pets'],
        available: true,
        instantBook: true,
        minStay: 1,
        maxStay: 30,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        ownerId: ownerProfile.id,
        approvalStatus: 'APPROVED' as any,
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewCount: 10 + Math.floor(Math.random() * 90),
      }
    });
    created++;

    // Create 3 room types per property
    const rtDefs = [
      { name: 'Standard Room', price: Math.round(basePrice * 1.0), inventory: 6, maxGuests: 2, bedType: 'Queen' },
      { name: 'Deluxe Room', price: Math.round(basePrice * 1.3), inventory: 4, maxGuests: 3, bedType: 'King' },
      { name: 'Family Suite', price: Math.round(basePrice * 1.8), inventory: 2, maxGuests: 4, bedType: 'King + Sofa Bed' },
    ];
    for (const def of rtDefs) {
      await prisma.roomType.create({
        data: {
          propertyId: prop.id,
          name: def.name,
          description: `${def.name} with modern amenities`,
          maxGuests: def.maxGuests,
          beds: 1,
          bedType: def.bedType,
          basePrice: def.price,
          inventory: def.inventory,
          amenities: ['WiFi', 'TV', 'AC', 'Room Service'],
          images: images,
          available: true,
        }
      });
      roomTypesCreated++;
    }
  }

  return json({ ok: true, propertiesCreated: created, roomTypesCreated });
}

export async function loader() {
  return json({ error: 'Method Not Allowed' }, { status: 405 });
}

export default function Seed() { return null }
