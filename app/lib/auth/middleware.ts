import { redirect } from "@remix-run/node";
import { getUser } from "./auth.server";

export async function requireRole(request: Request, allowedRoles: Array<'CUSTOMER' | 'PROPERTY_OWNER' | 'VEHICLE_OWNER' | 'TOUR_GUIDE' | 'SUPER_ADMIN'>) {
  const user = await getUser(request);

  if (!user) {
    throw redirect('/login');
  }

  if (!allowedRoles.includes(user.role)) {
    throw redirect('/unauthorized');
  }

  return user;
}

export async function requireCustomer(request: Request) {
  return requireRole(request, ['CUSTOMER']);
}

export async function requirePropertyOwner(request: Request) {
  return requireRole(request, ['PROPERTY_OWNER']);
}

export async function requireVehicleOwner(request: Request) {
  return requireRole(request, ['VEHICLE_OWNER']);
}

export async function requireTourGuide(request: Request) {
  return requireRole(request, ['TOUR_GUIDE']);
}

export async function requireAdmin(request: Request) {
  return requireRole(request, ['SUPER_ADMIN']);
}

export async function requireProvider(request: Request) {
  return requireRole(request, ['PROPERTY_OWNER', 'VEHICLE_OWNER', 'TOUR_GUIDE']);
}
