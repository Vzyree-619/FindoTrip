import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { prisma } from "~/lib/db/db.server";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
      secrets: [sessionSecret],
      secure: process.env.NODE_ENV === "production",
    },
  });

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verified: true,
        active: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });
    return user;
  } catch {
    // Avoid redirect loops if the database is unavailable.
    console.error('session.getUser: database error; returning null to avoid redirect loop');
    return null;
  }
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export { getSession, commitSession, destroySession };
