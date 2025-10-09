// Lightweight feature tests using tsx (no external test framework)
// Verifies key loaders return expected shapes and computed values

type Loader = (args: any) => Promise<any>;

async function getJson(res: any) {
  if (res instanceof Response) return res.json();
  return res;
}

function args(url: string, params: Record<string, string> = {}) {
  return { request: new Request(url), params };
}

async function testToursList() {
  const { loader } = await import('../app/routes/tours/index.tsx');
  const res = await loader(args('http://localhost/tours'));
  const data = await getJson(res);
  if (!data || !Array.isArray(data.tours)) throw new Error('Tours list: missing tours array');
  if (typeof data.total !== 'number') throw new Error('Tours list: missing total');
  console.log('✓ Tours list loader OK:', data.tours.length, 'items');
}

async function testTourDetail() {
  const { loader } = await import('../app/routes/tours.$id.tsx');
  const res = await loader(args('http://localhost/tour/test-id', { id: 'test-id' }));
  const data = await getJson(res);
  if (!data || !data.tour) throw new Error('Tour detail: missing tour');
  const t = data.tour;
  ['id', 'title', 'images', 'price', 'groupSize'].forEach((k) => {
    if (!(k in t)) throw new Error(`Tour detail: missing ${k}`);
  });
  console.log('✓ Tour detail loader OK:', t.title);
}

async function testVehiclesList() {
  const { loader } = await import('../app/routes/vehicles/index.tsx');
  const res = await loader(args('http://localhost/vehicles'));
  const data = await getJson(res);
  if (!data || !Array.isArray(data.vehicles)) throw new Error('Vehicles list: missing vehicles array');
  if (typeof data.total !== 'number') throw new Error('Vehicles list: missing total');
  console.log('✓ Vehicles list loader OK:', data.vehicles.length, 'items');
}

async function testVehicleDetail() {
  const { loader } = await import('../app/routes/vehicles.$id.tsx');
  const res = await loader(args('http://localhost/vehicle/test-veh', { id: 'test-veh' }));
  const data = await getJson(res);
  if (!data || !data.vehicle) throw new Error('Vehicle detail: missing vehicle');
  const v = data.vehicle;
  ['id', 'images', 'price', 'location'].forEach((k) => {
    if (!(k in v)) throw new Error(`Vehicle detail: missing ${k}`);
  });
  console.log('✓ Vehicle detail loader OK:', v.name || v.model);
}

async function testVehicleBookingLoader() {
  const { loader } = await import('../app/routes/book/vehicle.$id.tsx');
  const url = new URL('http://localhost/book/vehicle/test-veh');
  url.searchParams.set('startDate', '2025-01-10');
  url.searchParams.set('endDate', '2025-01-12');
  url.searchParams.set('pickupLocation', 'Hotel Lobby');
  try {
    const res = await loader(args(url.toString(), { id: 'test-veh' }));
    const data = await getJson(res);
    if (!data || !data.pricing) throw new Error('Vehicle booking: missing pricing');
    if (data.pricing.days !== 2) throw new Error('Vehicle booking: wrong day count');
    console.log('✓ Vehicle booking loader OK:', data.pricing.total);
  } catch (e: any) {
    // If auth is enforced at loader level, surface friendly message
    throw new Error('Vehicle booking loader failed (auth?): ' + (e?.message || e));
  }
}

async function main() {
  const tests = [
    ['Tours list', testToursList],
    ['Tour detail', testTourDetail],
    ['Vehicles list', testVehiclesList],
    ['Vehicle detail', testVehicleDetail],
    ['Vehicle booking loader', testVehicleBookingLoader],
  ];
  let failures = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
    } catch (e: any) {
      failures++;
      console.error(`✗ ${name} FAILED:`, e?.message || e);
    }
  }
  if (failures) {
    console.error(`\n${failures} test(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll tests passed');
  }
}

main();

