import { prisma } from "~/lib/db/db.server";

/**
 * Get the first super admin user
 * Used for public chat and support conversations
 */
export async function getSuperAdmin(): Promise<{ id: string; name: string; email: string } | null> {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: "asc", // Get the first/primary admin
      },
    });

    return admin;
  } catch (error) {
    console.error("Error getting super admin:", error);
    return null;
  }
}

