import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";

// Thin router to keep backward compatibility with /payment?bookingId=...&type=...
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");
  const type = url.searchParams.get("type");

  if (!bookingId || !type) {
    return json({ error: "Missing bookingId or type" }, { status: 400 });
  }

  return redirect(`/book/payment/${bookingId}?type=${type}`);
}

export default function PaymentRedirect() {
  return null;
}

