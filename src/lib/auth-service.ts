import { User } from '@/types/auth';
import { TargetBand } from '@/types/ielts';

export const DEFAULT_ADMIN_USER: User = {
  id: 'admin-shuhrat3',
  username: 'shuhrat3',
  email: 'admin@ieltsmentor.ai',
  fullName: 'Shuhrat (Platform Admin)',
  role: 'admin',
  targetBand: '9.0',
  createdAt: Date.now()
};

export const DEFAULT_ADMIN_PASS = '$Huhrat333';

export const DEFAULT_TEST_USER: User = {
  id: 'user-testuser',
  username: 'testuser',
  email: 'testuser@gmail.com',
  fullName: 'Ordinary Test Student',
  role: 'user',
  targetBand: '7.5',
  createdAt: Date.now()
};

export const DEFAULT_TEST_PASS = 'testuser1';

/**
 * Local Authentication Manager
 */
export class AuthService {
  private static AUTH_KEY = 'ielts_auth_session_user';

  static getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(this.AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static storeUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
  }

  static clearUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.AUTH_KEY);
  }

  static login(identifier: string, pass: string): { success: boolean; user?: User; error?: string } {
    const cleanId = identifier.trim().toLowerCase();

    // Check Default Admin Credentials
    if ((cleanId === 'shuhrat3' || cleanId === 'admin@ieltsmentor.ai') && pass === DEFAULT_ADMIN_PASS) {
      this.storeUser(DEFAULT_ADMIN_USER);
      return { success: true, user: DEFAULT_ADMIN_USER };
    }

    // Check Default Ordinary Test User Credentials
    if ((cleanId === 'testuser@gmail.com' || cleanId === 'testuser') && pass === DEFAULT_TEST_PASS) {
      this.storeUser(DEFAULT_TEST_USER);
      return { success: true, user: DEFAULT_TEST_USER };
    }

    // Standard User Login Mock
    if (pass.length >= 4) {
      const user: User = {
        id: `user-${Date.now()}`,
        username: cleanId.split('@')[0] || 'student',
        email: cleanId.includes('@') ? cleanId : `${cleanId}@example.com`,
        fullName: cleanId.split('@')[0].toUpperCase(),
        role: 'user',
        targetBand: '7.0',
        createdAt: Date.now()
      };
      this.storeUser(user);
      return { success: true, user };
    }

    return { success: false, error: 'Invalid email/username or password' };
  }

  static register(fullName: string, email: string, pass: string, targetBand: TargetBand): { success: boolean; user?: User; error?: string } {
    if (!fullName || !email || !pass) {
      return { success: false, error: 'Please fill in all required fields' };
    }

    const user: User = {
      id: `user-${Date.now()}`,
      username: email.split('@')[0],
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      role: 'user',
      targetBand,
      createdAt: Date.now()
    };

    this.storeUser(user);
    return { success: true, user };
  }

  static resetPassword(email: string): { success: boolean; message: string } {
    return {
      success: true,
      message: `Password reset instructions have been sent to ${email}. Check your inbox!`
    };
  }
}
