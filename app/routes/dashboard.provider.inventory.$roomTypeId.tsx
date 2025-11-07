import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useParams, Link } from "@remix-run/react";
import { prisma } from "~/lib/db/db.server";
import { requireUserId } from "~/lib/auth/auth.server";
import { Calendar } from "~/components/ui/calendar";

function normalizeDate(d: Date) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") throw redirect("/login");

  const roomTypeId = params.roomTypeId!;
  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId }, include: { property: true } });
  if (!roomType) throw new Response("Not found", { status: 404 });

  const owner = await prisma.propertyOwner.findUnique({ where: { id: roomType.property.ownerId } });
  if (!owner || owner.userId !== userId) throw new Response("Forbidden", { status: 403 });

  // Load next 60 days inventory
  const start = normalizeDate(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 60);
  const inventories = await prisma.roomInventoryDaily.findMany({
    where: { roomTypeId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" }
  });

  return json({ roomType, inventories, capacity: roomType.inventory || 1 });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role !== "PROPERTY_OWNER") return json({ error: "Not authorized" }, { status: 403 });

  const roomTypeId = params.roomTypeId!;
  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId }, include: { property: true } });
  if (!roomType) return json({ error: "Room type not found" }, { status: 404 });
  const owner = await prisma.propertyOwner.findUnique({ where: { id: roomType.property.ownerId } });
  if (!owner || owner.userId !== userId) return json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "setInventory") {
    const dateStr = form.get("date") as string;
    const available = parseInt((form.get("available") as string) || "0", 10);
    const note = (form.get("note") as string) || undefined;
    if (!dateStr) return json({ error: "Date required" }, { status: 400 });
    const date = normalizeDate(new Date(dateStr));
    const existing = await prisma.roomInventoryDaily.findFirst({ where: { roomTypeId, date } });
    if (existing) {
      await prisma.roomInventoryDaily.update({ where: { id: existing.id }, data: { available, note } });
    } else {
      await prisma.roomInventoryDaily.create({ data: { roomTypeId, date, available, note, blocked: 0 } });
    }
    return redirect(`/dashboard/provider/inventory/${roomTypeId}`);
  }

  if (intent === "bulkSetInventory") {
    const startStr = form.get("startDate") as string;
    const endStr = form.get("endDate") as string;
    const available = parseInt((form.get("available") as string) || "0", 10);
    const note = (form.get("note") as string) || undefined;
    if (!startStr || !endStr) return json({ error: "Start and end dates required" }, { status: 400 });
    const start = normalizeDate(new Date(startStr));
    const end = normalizeDate(new Date(endStr));
    if (start > end) return json({ error: "End date must be after start date" }, { status: 400 });
    const day = new Date(start);
    while (day <= end) {
      const existing = await prisma.roomInventoryDaily.findFirst({ where: { roomTypeId, date: day } });
      if (existing) {
        await prisma.roomInventoryDaily.update({ where: { id: existing.id }, data: { available, note } });
      } else {
        await prisma.roomInventoryDaily.create({ data: { roomTypeId, date: new Date(day), available, note, blocked: 0 } });
      }
      day.setDate(day.getDate() + 1);
    }
    return redirect(`/dashboard/provider/inventory/${roomTypeId}`);
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function RoomInventory() {
  const { roomType, inventories, capacity } = useLoaderData<typeof loader>();
  const params = useParams();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  // Build a map for quick lookup
  const invMap = new Map<string, any>();
  inventories.forEach((i: any) => {
    const key = new Date(i.date).toISOString().split('T')[0];
    invMap.set(key, i);
  });

  const getAvailForDate = (date: Date) => {
    const key = new Date(date).toISOString().split('T')[0];
    const rec = invMap.get(key);
    return typeof rec?.available === 'number' ? rec.available : capacity;
  };

  const DayButtonColored = ({ className, day, modifiers, ...props }: any) => {
    const avail = getAvailForDate(day.date);
    let colorClass = '';
    if (avail <= 0) colorClass = 'bg-red-100 text-red-700';
    else if (avail <= Math.max(1, Math.floor(capacity * 0.25))) colorClass = 'bg-orange-100 text-orange-700';
    else if (avail <= Math.max(1, Math.floor(capacity * 0.5))) colorClass = 'bg-yellow-100 text-yellow-800';
    else colorClass = 'bg-green-50 text-green-700';
    return (
      <button
        className={`group/day relative aspect-square h-full w-full select-none p-0 text-center rounded-md ${colorClass}`}
        {...props}
      >
        {day.date.getDate()}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Inventory — {roomType.name}</h1>
          <Link to="/dashboard/provider/rooms" className="text-[#01502E] underline">Back to Room Types</Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Calendar
            mode="single"
            numberOfMonths={2}
            selected={selectedDate}
            onSelect={(d: Date | undefined) => setSelectedDate(d)}
            components={{ DayButton: DayButtonColored }}
            footer={
              <div className="text-sm text-gray-600 flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 bg-green-50 border rounded"></span> Good availability</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 bg-yellow-100 border rounded"></span> Moderate</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 bg-orange-100 border rounded"></span> Low</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-100 border rounded"></span> Fully booked</span>
              </div>
            }
          />
          <div className="mt-6">
            <Form method="post" className="flex items-end gap-3">
              <input type="hidden" name="intent" value="setInventory" />
              <div>
                <label className="block text-sm font-medium">Date</label>
                <input
                  name="date"
                  type="date"
                  className="border rounded px-3 py-2"
                  required
                  value={selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Available Rooms</label>
                <input name="available" type="number" min={0} className="border rounded px-3 py-2" placeholder="e.g. 3" required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">Note</label>
                <input name="note" className="w-full border rounded px-3 py-2" placeholder="Optional note" />
              </div>
              <button className="px-4 py-2 bg-[#01502E] text-white rounded">Save</button>
            </Form>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Bulk Update Range</h3>
            <Form method="post" className="flex items-end gap-3 flex-wrap">
              <input type="hidden" name="intent" value="bulkSetInventory" />
              <div>
                <label className="block text-sm font-medium">Start Date</label>
                <input name="startDate" type="date" className="border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">End Date</label>
                <input name="endDate" type="date" className="border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Available Rooms</label>
                <input name="available" type="number" min={0} className="border rounded px-3 py-2" placeholder="e.g. 3" required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">Note</label>
                <input name="note" className="w-full border rounded px-3 py-2" placeholder="Optional note" />
              </div>
              <button className="px-4 py-2 bg-[#01502E] text-white rounded">Apply to Range</button>
            </Form>
          </div>
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Upcoming 60 days</h2>
            <div className="grid grid-cols-2 gap-3">
              {inventories.map((i: any) => (
                <div key={i.id} className="border rounded p-3">
                  <div className="text-sm text-gray-600">{new Date(i.date).toISOString().split('T')[0]}</div>
                  <div className="font-semibold">Available: {i.available}</div>
                  {i.note && <div className="text-sm text-gray-700">{i.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
