// Seed demo stays (properties) and room types directly via Prisma (CommonJS)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)] }

async function main() {
  console.log('Seeding demo stays...');
  const ownerEmail = 'owner@example.com';
  const ownerUser = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { role: 'PROPERTY_OWNER', name: 'Demo Owner' },
    create: { email: ownerEmail, password: 'demo1234', name: 'Demo Owner', role: 'PROPERTY_OWNER' }
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

  const cities = [
    { city: 'Islamabad', country: 'Pakistan' },
    { city: 'Lahore', country: 'Pakistan' },
    { city: 'Karachi', country: 'Pakistan' },
    { city: 'Murree', country: 'Pakistan' },
    { city: 'Hunza', country: 'Pakistan' },
  ];
  const propertyTypes = ['HOTEL','APARTMENT','VILLA','RESORT','HOSTEL','LODGE'];
  const adjectives = ['Sunrise','Emerald','Oakwood','Cedar','Blue Sky'];
  const nouns = ['Hotel','Suites','Residency','Lodge'];

  let created = 0, skipped = 0, roomTypesCreated = 0;
  for (let i=0;i<5;i++) {
    const loc = cities[i % cities.length];
    const pName = `${pick(adjectives)} ${pick(nouns)} ${loc.city}`;
    const exists = await prisma.property.findFirst({ where: { name: pName, ownerId: ownerProfile.id } });
    if (exists) { skipped++; continue; }
    const basePrice = 5000 + Math.floor(Math.random()*5000);
    const prop = await prisma.property.create({
      data: {
        name: pName,
        description: 'A lovely stay with comfortable rooms and friendly service.',
        type: pick(propertyTypes),
        address: 'Main Road',
        city: loc.city,
        country: loc.country,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        basePrice,
        images: ['/placeholder-hotel.jpg'],
        amenities: ['WiFi','Breakfast','Air Conditioning','Parking','TV','Room Service'],
        available: true,
        instantBook: true,
        ownerId: ownerProfile.id,
        approvalStatus: 'APPROVED',
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

  console.log({ created, skipped, roomTypesCreated });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

