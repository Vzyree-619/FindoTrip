import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/auth/auth-strategies.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if Google OAuth is configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Response("Google OAuth not configured", { status: 500 });
  }
  
  return authenticator.authenticate("google", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login?error=google_auth_failed",
  });
}

