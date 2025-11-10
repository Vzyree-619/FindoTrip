import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") throw redirect("/login");

  const owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true, businessName: true } });
  if (!owner) return json({ properties: [], roomsByProperty: {} });

  const properties = await prisma.property.findMany({ where: { ownerId: owner.id }, select: { id: true, name: true } });
  const roomsByProperty: Record<string, any[]> = {};
  for (const p of properties) {
    roomsByProperty[p.id] = await prisma.roomType.findMany({ where: { propertyId: p.id } });
  }
  return json({ properties, roomsByProperty });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") return json({ error: "Not authorized" }, { status: 403 });

  const owner = await prisma.propertyOwner.findUnique({ where: { userId }, select: { id: true } });
  if (!owner) return json({ error: "Owner profile not found" }, { status: 400 });

  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "create") {
    const propertyId = form.get("propertyId") as string;
    const name = (form.get("name") as string)?.trim();
    const description = ((form.get("description") as string) || "").trim();
    const maxGuests = parseInt((form.get("maxGuests") as string) || "1", 10);
    const beds = parseInt((form.get("beds") as string) || "0", 10);
    const bedType = (form.get("bedType") as string) || undefined;
    const basePrice = parseFloat((form.get("basePrice") as string) || "0");
    const inventory = parseInt((form.get("inventory") as string) || "1", 10);
    const amenitiesRaw = (form.get("amenities") as string) || "";
    const imageUrl = (form.get("imageUrl") as string) || "";

    if (!propertyId || !name || !basePrice) {
      return json({ error: "Property, name and base price are required" }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } });
    if (!property || property.ownerId !== owner.id) return json({ error: "Invalid property" }, { status: 403 });

    const amenities = amenitiesRaw.split(",").map(s => s.trim()).filter(Boolean);

    await prisma.roomType.create({
      data: {
        propertyId,
        name,
        description,
        maxGuests,
        beds,
        bedType,
        basePrice,
        inventory,
        amenities,
        images: imageUrl ? [imageUrl] : [],
        available: true,
      }
    });
    return redirect("/dashboard/provider/rooms");
  }

  if (intent === "delete") {
    const id = form.get("id") as string;
    const room = await prisma.roomType.findUnique({ where: { id }, include: { property: { select: { ownerId: true } } } });
    if (!room || room.property.ownerId !== owner.id) return json({ error: "Invalid room" }, { status: 403 });
    await prisma.roomType.delete({ where: { id } });
    return redirect("/dashboard/provider/rooms");
  }

  if (intent === "toggle") {
    const id = form.get("id") as string;
    const room = await prisma.roomType.findUnique({ where: { id }, include: { property: { select: { ownerId: true } } } });
    if (!room || room.property.ownerId !== owner.id) return json({ error: "Invalid room" }, { status: 403 });
    await prisma.roomType.update({ where: { id }, data: { available: !room.available } });
    return redirect("/dashboard/provider/rooms");
  }

  if (intent === "update") {
    const id = form.get("id") as string;
    const name = (form.get("name") as string)?.trim();
    const basePriceRaw = (form.get("basePrice") as string) || "";
    const inventoryRaw = (form.get("inventory") as string) || "";
    const room = await prisma.roomType.findUnique({ where: { id }, include: { property: { select: { ownerId: true } } } });
    if (!room || room.property.ownerId !== owner.id) return json({ error: "Invalid room" }, { status: 403 });
    const data: any = {};
    if (name) data.name = name;
    if (basePriceRaw) {
      const basePrice = parseFloat(basePriceRaw);
      if (!isNaN(basePrice)) data.basePrice = basePrice;
    }
    if (inventoryRaw) {
      const inventory = parseInt(inventoryRaw, 10);
      if (!isNaN(inventory) && inventory > 0) data.inventory = inventory;
    }
    if (Object.keys(data).length) {
      await prisma.roomType.update({ where: { id }, data });
    }
    return redirect("/dashboard/provider/rooms");
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function ProviderRooms() {
  const { properties, roomsByProperty } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Room Types</h1>

        {/* Existing room types */}
        {properties.map((p: any) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <span className="text-sm text-gray-600">{roomsByProperty[p.id]?.length || 0} room types</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(roomsByProperty[p.id] || []).map((rt: any) => (
                <div key={rt.id} className="border rounded-lg overflow-hidden">
                  <img src={rt.images?.[0] || '/landingPageImg.jpg'} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{rt.name}</div>
                        <div className="text-sm text-gray-600">Sleeps {rt.maxGuests}{rt.bedType ? ` • ${rt.bedType}` : ''}</div>
                      </div>
                      <div className="text-[#01502E] font-semibold">PKR {rt.basePrice.toLocaleString()}/night</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${rt.available ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{rt.available ? 'Available' : 'Unavailable'}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Inventory: {rt.inventory}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Form method="post">
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="id" value={rt.id} />
                        <button className="border rounded px-3 py-2">{rt.available ? 'Disable' : 'Enable'}</button>
                      </Form>
                      <Link to={`/dashboard/provider/inventory/${rt.id}`} className="border rounded px-3 py-2">Inventory</Link>
                      <Form method="post" className="flex items-center gap-2">
                        <input type="hidden" name="intent" value="update" />
                        <input type="hidden" name="id" value={rt.id} />
                        <input name="name" defaultValue={rt.name} className="border rounded px-2 py-1 text-sm" placeholder="Name" />
                        <input name="basePrice" type="number" min="0" step="1" defaultValue={rt.basePrice} className="border rounded px-2 py-1 text-sm w-32" placeholder="Price" />
                        <input name="inventory" type="number" min="1" defaultValue={rt.inventory} className="border rounded px-2 py-1 text-sm w-24" placeholder="Inventory" />
                        <button className="border rounded px-3 py-2">Save</button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={rt.id} />
                        <button className="border rounded px-3 py-2 text-red-600">Delete</button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Create room type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create Room Type</h2>
          <Form method="post" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="intent" value="create" />
            <div>
              <label className="block text-sm font-medium mb-1">Property</label>
              <select name="propertyId" className="w-full border rounded px-3 py-2">
                {properties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input name="name" required className="w-full border rounded px-3 py-2" placeholder="Deluxe King" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full border rounded px-3 py-2" placeholder="Describe this room type" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Guests</label>
              <input name="maxGuests" type="number" min="1" required className="w-full border rounded px-3 py-2" placeholder="2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beds</label>
              <input name="beds" type="number" min="0" className="w-full border rounded px-3 py-2" placeholder="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bed Type</label>
              <input name="bedType" className="w-full border rounded px-3 py-2" placeholder="King, Twin" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Price (PKR)</label>
              <input name="basePrice" type="number" step="1" min="0" required className="w-full border rounded px-3 py-2" placeholder="6000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Inventory</label>
              <input name="inventory" type="number" min="1" required className="w-full border rounded px-3 py-2" placeholder="5" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
              <input name="amenities" className="w-full border rounded px-3 py-2" placeholder="WiFi, Breakfast, AC" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input name="imageUrl" className="w-full border rounded px-3 py-2" placeholder="https://.../room.jpg" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-[#01502E] text-white rounded-md">
                Create Room Type
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
