import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma, createBooking } from "~/lib/db/db.server";
import { Calendar, Users } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);

  const accommodation = await prisma.accommodation.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      pricePerNight: true,
      city: true,
      country: true,
      images: true,
    },
  });

  if (!accommodation) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ accommodation });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  const checkIn = formData.get("checkIn");
  const checkOut = formData.get("checkOut");
  const guests = formData.get("guests");
  const specialRequests = formData.get("specialRequests");

  if (
    typeof checkIn !== "string" ||
    typeof checkOut !== "string" ||
    typeof guests !== "string"
  ) {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  const checkInDate = parseISO(checkIn);
  const checkOutDate = parseISO(checkOut);
  const nights = differenceInDays(checkOutDate, checkInDate);

  if (nights <= 0) {
    return json({ error: "Check-out must be after check-in" }, { status: 400 });
  }

  const accommodation = await prisma.accommodation.findUnique({
    where: { id: params.id },
  });

  if (!accommodation) {
    return json({ error: "Accommodation not found" }, { status: 404 });
  }

  const totalPrice = accommodation.pricePerNight * nights;

  const booking = await createBooking({
    userId,
    accommodationId: accommodation.id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: parseInt(guests),
    totalPrice,
    specialRequests: (specialRequests as string) || undefined,
  });

  return redirect(`/bookings/${booking.id}`);
}

export default function BookStay() {
  const { accommodation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Complete your booking
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <div className="w-32 h-24 bg-gray-300 rounded-lg overflow-hidden flex-shrink-0">
              {accommodation.images[0] ? (
                <img
                  src={accommodation.images[0]}
                  alt={accommodation.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  🏨
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {accommodation.name}
              </h2>
              <p className="text-gray-600">
                {accommodation.city}, {accommodation.country}
              </p>
              <p className="text-blue-600 font-semibold mt-2">
                ${accommodation.pricePerNight} / night
              </p>
            </div>
          </div>

          <Form method="post" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Check-in
                </label>
                <input
                  type="date"
                  name="checkIn"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Check-out
                </label>
                <input
                  type="date"
                  name="checkOut"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Number of Guests
              </label>
              <input
                type="number"
                name="guests"
                min="1"
                defaultValue="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                name="specialRequests"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01502E]"
                placeholder="Any special requirements or requests..."
              />
            </div>

            {actionData?.error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {actionData.error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#01502E] hover:bg-[#013d23] text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="font-bold">PKR</span>
              Confirm and Pay
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
