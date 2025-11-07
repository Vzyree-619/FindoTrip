import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)] }

export async function action({ request }: ActionFunctionArgs) {
  // Basic guard: require header token to run
  const token = request.headers.get('x-seed-token') || '';
  const expected = process.env.SEED_TOKEN || 'dev';
  if (token !== expected) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Upsert a property owner user
  const ownerEmail = 'owner@example.com';
  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: 'PROPERTY_OWNER', name: 'Demo Owner' },
    create: { email: ownerEmail, password: 'demo1234', name: 'Demo Owner', role: 'PROPERTY_OWNER' as any }
  });

  // Upsert property owner profile with required fields
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
        bankName: 'Demo Bank',
        accountNumber: '000123456789',
        routingNumber: '000000',
        paypalEmail: null,
        verified: true,
      }
    });
  }

  const cities = [
    { city: 'Islamabad', country: 'Pakistan' },
    { city: 'Lahore', country: 'Pakistan' },
    { city: 'Karachi', country: 'Pakistan' },
    { city: 'Murree', country: 'Pakistan' },
    { city: 'Hunza', country: 'Pakistan' },
  ];

  const propertyTypes = ['HOTEL','APARTMENT','VILLA','RESORT','HOSTEL','LODGE'] as const;
  const amenitiesPool = ['WiFi','Breakfast','Air Conditioning','Parking','Pool','Gym','TV','Room Service','Heater'];

  let created = 0, skipped = 0, roomTypesCreated = 0;
  for (let i=0;i<5;i++) {
    const loc = cities[i % cities.length];
    const pName = `${pick(['Sunrise','Emerald','Oakwood','Cedar','Blue Sky'])} ${pick(['Hotel','Suites','Residency','Lodge'])} ${loc.city}`;
    const existing = await prisma.property.findFirst({ where: { name: pName, ownerId: ownerProfile.id } });
    if (existing) { skipped++; continue; }
    const basePrice = 5000 + Math.floor(Math.random()*5000);
    const prop = await prisma.property.create({
      data: {
        name: pName,
        description: 'A lovely stay with comfortable rooms and friendly service.',
        type: pick(propertyTypes) as any,
        address: 'Main Road',
        city: loc.city,
        country: loc.country,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        basePrice,
        images: ['/placeholder-hotel.jpg'],
        amenities: pick(amenitiesPool.concat(amenitiesPool)).split ? amenitiesPool.slice(0,5) : amenitiesPool.slice(0,5),
        available: true,
        instantBook: true,
        ownerId: ownerProfile.id,
        approvalStatus: 'APPROVED' as any,
        rating: 4.5,
        reviewCount: 12,
      }
    });
    created++;

    const rtDefs = [
      { name: 'Standard Room', price: Math.round(basePrice*1.0), inventory: 5, maxGuests: 2, bedType: 'Queen' },
      { name: 'Deluxe Room', price: Math.round(basePrice*1.3), inventory: 4, maxGuests: 3, bedType: 'King' },
      { name: 'Family Suite', price: Math.round(basePrice*1.8), inventory: 2, maxGuests: 4, bedType: 'King + Sofa Bed' },
    ];
    for (const def of rtDefs) {
      const rtExists = await prisma.roomType.findFirst({ where: { propertyId: prop.id, name: def.name } });
      if (rtExists) continue;
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
          amenities: ['WiFi','TV','AC','Room Service'],
          images: ['/placeholder-hotel.jpg'],
          available: true,
        }
      });
      roomTypesCreated++;
    }
  }

  return json({ ok: true, created, skipped, roomTypesCreated });
}

export async function loader() {
  return json({ error: 'Method Not Allowed' }, { status: 405 });
}

export default function Seed() { return null }

