import { NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { User } from '@/types/auth';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'shuhrat3';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ieltsmentor.ai';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '$Huhrat333';

export async function POST(req: Request) {
  // 1. Rate Limiting Protection (5 login attempts / min per IP to prevent brute-force attacks)
  const rateLimitResult = checkRateLimit(req, {
    limit: 5,
    windowMs: 60 * 1000,
    prefix: 'auth_login',
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password);

    const isAdminId =
      cleanId === ADMIN_USERNAME.toLowerCase() || cleanId === ADMIN_EMAIL.toLowerCase();

    // 2. Admin Verification (Server-Side Only - Secret never exposed to browser)
    if (isAdminId) {
      if (cleanPass === ADMIN_PASSWORD) {
        const adminUser: User = {
          id: 'admin-shuhrat3',
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          fullName: 'Shuhrat (Platform Admin)',
          role: 'admin',
          targetBand: '9.0',
          createdAt: Date.now(),
        };

        return NextResponse.json({
          success: true,
          user: adminUser,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Please verify your details.' },
        { status: 401 }
      );
    }

    // 3. Standard User Login Verification
    if (cleanPass.length >= 4) {
      const isEmail = cleanId.includes('@');
      const standardUser: User = {
        id: `user-${Date.now()}`,
        username: cleanId.split('@')[0] || 'student',
        email: isEmail ? cleanId : `${cleanId}@example.com`,
        fullName: cleanId.split('@')[0].toUpperCase(),
        role: 'user',
        targetBand: '7.0',
        createdAt: Date.now(),
      };

      return NextResponse.json({
        success: true,
        user: standardUser,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials. Please verify your details.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an error' },
      { status: 500 }
    );
  }
}
