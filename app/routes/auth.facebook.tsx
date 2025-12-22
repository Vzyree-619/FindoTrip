import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/auth/auth-strategies.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if Facebook OAuth is configured
  if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
    throw new Response("Facebook OAuth not configured", { status: 500 });
  }
  
  return authenticator.authenticate("facebook", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login?error=facebook_auth_failed",
  });
}

