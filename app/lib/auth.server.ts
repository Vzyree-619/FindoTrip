import { createCookieSessionStorage, redirect } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { prisma } from './db.server';

// Session management
const sessionSecret = process.env.SESSION_SECRET || 'default-secret-change-in-production';

const storage = createCookieSessionStorage({
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
    throw logout(request);
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
  role: 'CUSTOMER' | 'CAR_PROVIDER' | 'TOUR_GUIDE' = 'CUSTOMER'
) {
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
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });


  if (role === 'TOUR_GUIDE') {
    await prisma.tourGuide.create({
      data: {
        userId: user.id,
        bio: '',
        languages: ['English'],
        specialties: [],
        experience: 0,
        pricePerHour: 50,
        city: '',
        country: '',
      },
    });
  }

  return { user };
}

export async function login(email: string, password: string) {
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