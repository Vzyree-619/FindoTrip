// Seed demo stays (properties) and room types directly via Prisma (CommonJS)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)] }

async function main() {
  console.log('Seeding demo stays (wipe and reseed)...');
  const ownerEmail = 'owner@example.com';
  // Avoid upsert to support MongoDB deployments without transactions
  let ownerUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!ownerUser) {
    ownerUser = await prisma.user.create({
      data: { email: ownerEmail, password: 'demo1234', name: 'Demo Owner', role: 'PROPERTY_OWNER' }
    });
  } else {
    ownerUser = await prisma.user.update({
      where: { email: ownerEmail },
      data: { role: 'PROPERTY_OWNER', name: 'Demo Owner' }
    });
  }

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

  // Wipe previous stays
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
  const propertyTypes = ['HOTEL','APARTMENT','VILLA','RESORT','HOSTEL','LODGE','BOUTIQUE_HOTEL','GUESTHOUSE'];
  const adjectives = ['Sunrise','Emerald','Oakwood','Cedar','Blue Sky','Golden Peak','Valley View','Lakeside','Mountain Nest','Royal'];
  const nouns = ['Hotel','Suites','Residency','Lodge','Inn','Resort','Guest House','Boutique'];
  const images = ['/alnoor.png','/legend.jpg','/himmel.jpg','/sukoonREsord.jpg','/shigerFort.jpg','/shigerlack.jpg','/deosai.jpg','/khaplu.jpg','/awariExpress.jpg','/two.jpg','/three.jpg','/one.jpg'];
  const amenitiesPool = ['WiFi','Breakfast','Air Conditioning','Parking','Pool','Gym','TV','Room Service','Heater','Kitchen','Lake View','Mountain View'];

  let created = 0, roomTypesCreated = 0;
  for (let i=0;i<12;i++) {
    const loc = cities[i % cities.length];
    const pName = `${pick(adjectives)} ${pick(nouns)} ${loc.city}`;
    const basePrice = 7000 + Math.floor(Math.random()*12000);
    const prop = await prisma.property.create({
      data: {
        name: pName,
        description: 'Comfortable stay with modern amenities and scenic views.',
        type: pick(propertyTypes),
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
        images: [pick(images)],
        videos: [],
        amenities: Array.from(new Set([pick(amenitiesPool), pick(amenitiesPool), pick(amenitiesPool), pick(amenitiesPool), pick(amenitiesPool)])).slice(0,6),
        safetyFeatures: ['Fire Extinguisher', 'Smoke Detector'],
        accessibility: ['Elevator'],
        houseRules: ['No Smoking','No Pets'],
        available: true,
        instantBook: true,
        minStay: 1,
        maxStay: 30,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        ownerId: ownerProfile.id,
        approvalStatus: 'APPROVED',
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewCount: 10 + Math.floor(Math.random() * 90),
      }
    });
    created++;

    const rtDefs = [
      { name: 'Standard Room', price: Math.round(basePrice*1.0), inventory: 6, maxGuests: 2, bedType: 'Queen' },
      { name: 'Deluxe Room', price: Math.round(basePrice*1.3), inventory: 4, maxGuests: 3, bedType: 'King' },
      { name: 'Family Suite', price: Math.round(basePrice*1.8), inventory: 2, maxGuests: 4, bedType: 'King + Sofa Bed' },
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
          amenities: ['WiFi','TV','AC','Room Service'],
          images: prop.images,
          available: true,
        }
      });
      roomTypesCreated++;
    }
  }

  console.log({ created, roomTypesCreated });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
