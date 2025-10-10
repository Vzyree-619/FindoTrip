import { json } from "@remix-run/node";

export function loader() {
  return json(null, { status: 302, headers: { Location: "/vehicles" } });
}

export default function CarRentalsRedirect() {
  return null;
}
