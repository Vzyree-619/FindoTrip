import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/auth/auth-strategies.server";
import { createUserSession } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await authenticator.authenticate("google", request, {
      failureRedirect: "/login?error=google_auth_failed",
    });

    if (!user) {
      return new Response("Authentication failed", { status: 401 });
    }

    // Create session and redirect
    return createUserSession(user.id, "/dashboard");
  } catch (error) {
    console.error("Google OAuth error:", error);
    return new Response("Authentication failed", { status: 401 });
  }
}

