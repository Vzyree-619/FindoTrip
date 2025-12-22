import { type LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/lib/auth/auth-strategies.server";
import { createUserSession } from "~/lib/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await authenticator.authenticate("facebook", request, {
      failureRedirect: "/login?error=facebook_auth_failed",
    });

    if (!user) {
      return new Response("Authentication failed", { status: 401 });
    }

    // Create session and redirect
    return createUserSession(user.id, "/dashboard");
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    return new Response("Authentication failed", { status: 401 });
  }
}

