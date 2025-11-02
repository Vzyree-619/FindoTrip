import { createCookieSessionStorage, redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '~/lib/db/db.server';

// Session management
const sessionSecret = process.env.SESSION_SECRET || 'default-secret-change-in-production';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'findotrip_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

const storage = sessionStorage;

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request): Promise<string | undefined> {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return undefined;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        verified: true,
      },
    });
    return user;
  } catch {
    // Avoid redirect loops (e.g., on /login) if the DB is unavailable.
    // Instead, return null so callers can handle unauthenticated state gracefully.
    console.error('getUser: database error; returning null to avoid redirect loop');
    return null;
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// User authentication
export async function register(
  email: string,
  password: string,
  name: string,
  role: 'CUSTOMER' | 'PROPERTY_OWNER' | 'VEHICLE_OWNER' | 'TOUR_GUIDE' = 'CUSTOMER',
  phone?: string
) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'A user with this email already exists' };
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });


  if (role === 'TOUR_GUIDE') {
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ') || 'Guide';
    await prisma.tourGuide.create({
      data: {
        userId: user.id,
        firstName: firstName || 'Guide',
        lastName,
        dateOfBirth: new Date('1990-01-01'),
        nationality: 'Unknown',
        yearsOfExperience: 0,
        languages: ['English'],
        specializations: [],
        certifications: [],
        serviceAreas: [],
        pricePerPerson: 0,
        workingHours: '09:00-17:00',
        // optional fields left to onboarding
        verified: false,
        documentsSubmitted: [],
      },
    });
  }

  return { user };
  } catch (e) {
    console.error('Register error:', e);
    return { error: 'Registration failed due to database connection/config issue' };
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (e) {
    console.error('Login error:', e);
    return { error: 'Login failed due to database connection/config issue' };
  }
}

// Authorization helpers
export async function requireRole(
  request: Request,
  allowedRoles: Array<'CUSTOMER' | 'CAR_PROVIDER' | 'TOUR_GUIDE' | 'ADMIN'>
) {
  const user = await getUser(request);
  if (!user) {
    throw redirect('/login');
  }
  if (!allowedRoles.includes(user.role)) {
    throw redirect('/unauthorized');
  }
  return user;
}

export async function requireCarProvider(request: Request) {
  return requireRole(request, ['CAR_PROVIDER', 'ADMIN']);
}

export async function requireTourGuide(request: Request) {
  return requireRole(request, ['TOUR_GUIDE', 'ADMIN']);
}

// Password Reset functionality
export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: 'User not found' };
  }

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Clean up any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id }
  });

  // Create new reset token
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  return { token, user };
}

export async function validatePasswordResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: 'Invalid or expired reset token' };
  }

  if (resetToken.used) {
    return { error: 'Reset token has already been used' };
  }

  if (new Date() > resetToken.expiresAt) {
    return { error: 'Reset token has expired' };
  }

  const user = await prisma.user.findUnique({
    where: { id: resetToken.userId },
  });

  if (!user) {
    return { error: 'User not found' };
  }

  return { user, resetToken };
}

export async function resetPassword(token: string, newPassword: string) {
  const validation = await validatePasswordResetToken(token);
  
  if ('error' in validation) {
    return validation;
  }

  const { user, resetToken } = validation;

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user password and mark token as used
  await Promise.all([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { success: true };
}
