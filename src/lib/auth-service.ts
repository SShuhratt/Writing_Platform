import { User } from '@/types/auth';
import { TargetBand } from '@/types/ielts';

/**
 * Client Authentication & Session Token Manager
 */
export class AuthService {
  private static AUTH_KEY = 'ielts_auth_session_user';
  private static USER_TOKEN_KEY = 'ielts_user_token';
  private static ADMIN_TOKEN_KEY = 'ielts_admin_token';
  private static TEACHER_TOKEN_KEY = 'ielts_teacher_token';

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
    this.clearUserToken();
    this.clearAdminToken();
    this.clearTeacherToken();
    // Clear httpOnly server session cookies even if clearing synchronously during UI logout.
    fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
  }

  static getUserToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.USER_TOKEN_KEY);
  }

  static storeUserToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_TOKEN_KEY, token);
    // Isolate student login from any previously lingering staff token.
    this.clearAdminToken();
    this.clearTeacherToken();
  }

  static clearUserToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.USER_TOKEN_KEY);
  }

  static getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ADMIN_TOKEN_KEY);
  }

  static storeAdminToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ADMIN_TOKEN_KEY, token);
    this.clearUserToken();
  }

  static clearAdminToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
  }

  static getTeacherToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TEACHER_TOKEN_KEY);
  }

  static storeTeacherToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TEACHER_TOKEN_KEY, token);
    this.clearUserToken();
    this.clearAdminToken();
  }

  static clearTeacherToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TEACHER_TOKEN_KEY);
  }

  static getStaffToken(): string | null {
    return this.getTeacherToken() || this.getAdminToken();
  }

  /**
   * Returns the active server-signed session token prioritized by currentUser role.
   */
  static getSessionToken(): string | null {
    const role = this.getStoredUser()?.role;
    if (role === 'admin') {
      return this.getAdminToken() || this.getTeacherToken() || this.getUserToken();
    }
    if (role === 'teacher') {
      return this.getTeacherToken() || this.getAdminToken() || this.getUserToken();
    }
    return this.getUserToken() || this.getTeacherToken() || this.getAdminToken();
  }

  /**
   * Checks server-side session validity (Bearer header and/or httpOnly cookie) via /api/auth/me.
   */
  static async verifyCurrentSession(): Promise<{
    authenticated: boolean;
    expired?: boolean;
    user?: User;
  }> {
    if (typeof window === 'undefined') return { authenticated: false };
    const token = this.getSessionToken();
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated && data?.user) {
          this.storeUser(data.user);
          return { authenticated: true, user: data.user };
        }
      }
      if (res.status === 401) {
        return { authenticated: false, expired: true };
      }
    } catch {
      // Transient network errors keep cached session so offline edits are not wiped
      const fallbackUser = this.getStoredUser();
      if (fallbackUser) {
        return { authenticated: true, user: fallbackUser };
      }
    }
    return { authenticated: false };
  }

  /**
   * Cryptographically verifies whether the current client session holds a valid, unexpired Admin token.
   * If verification fails, clears the forged or expired admin state.
   */
  static async verifyAdminSession(): Promise<boolean> {
    const token = this.getAdminToken();

    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        return Boolean(data.authenticated);
      }
    } catch (err) {
      console.warn('Admin session verification failed:', err);
    }

    this.clearAdminToken();
    const currentUser = this.getStoredUser();
    if (currentUser?.role === 'admin') {
      this.clearUser();
    }
    return false;
  }

  /**
   * Authenticates a standalone student or administrator via /api/auth/login.
   */
  static async login(
    identifier: string,
    pass: string
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: pass }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        this.storeUser(data.user);
        if (data.token) {
          if (data.user.role === 'admin') {
            this.storeAdminToken(data.token);
          } else {
            this.storeUserToken(data.token);
          }
        }
        return { success: true, user: data.user, token: data.token };
      }

      return {
        success: false,
        error: data.message || data.error || 'Invalid email/username or password',
      };
    } catch {
      return { success: false, error: 'Network error during login. Please try again.' };
    }
  }

  /**
   * Registers a persistent standalone student account via /api/auth/register.
   */
  static async register(
    fullName: string,
    email: string,
    pass: string,
    targetBand: TargetBand
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    if (!fullName || !email || !pass) {
      return { success: false, error: 'Please fill in all required fields' };
    }
    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password: pass, targetBand }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        this.storeUser(data.user);
        if (data.token) {
          this.storeUserToken(data.token);
        }
        return { success: true, user: data.user, token: data.token };
      }

      return {
        success: false,
        error: data.error || 'Registration failed. Please verify your details.',
      };
    } catch {
      return { success: false, error: 'Network error during registration. Please try again.' };
    }
  }

  /**
   * Verifies a Google Identity Services JWT credential on the server via /api/auth/google.
   */
  static async loginWithGoogle(
    credential: string
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        this.storeUser(data.user);
        if (data.token) {
          this.storeUserToken(data.token);
        }
        return { success: true, user: data.user, token: data.token };
      }

      return {
        success: false,
        error: data.error || 'Google sign-in failed verification.',
      };
    } catch {
      return { success: false, error: 'Network error during Google Sign-In.' };
    }
  }

  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || `If an account exists for ${email}, password reset instructions have been sent.`,
        };
      }
      return {
        success: false,
        message: '',
        error: data.error || 'Could not process password reset request.',
      };
    } catch {
      return { success: false, message: '', error: 'Network error while requesting password reset.' };
    }
  }

  static async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Password updated successfully. You can now sign in.',
        };
      }
      return {
        success: false,
        error: data.error || 'Invalid or expired reset token.',
      };
    } catch {
      return { success: false, error: 'Network error while updating password.' };
    }
  }

  static async verifyEmailToken(
    token: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        const stored = this.getStoredUser();
        if (stored && data.email && stored.email?.toLowerCase() === String(data.email).toLowerCase()) {
          this.storeUser({ ...stored, emailVerified: true });
        }
        return { success: true, message: data.message || 'Email verified successfully.' };
      }
      return { success: false, error: data.error || 'Verification link is invalid or expired.' };
    } catch {
      return { success: false, error: 'Network error during email verification.' };
    }
  }

  /**
   * Signs in or registers a School Teacher / Instructor via /api/auth/teacher.
   */
  static async teacherAuth(params: {
    mode: 'LOGIN' | 'REGISTER';
    email: string;
    password: string;
    fullName?: string;
    schoolName?: string;
    accessCode?: string;
  }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user && data.token) {
        this.storeUser(data.user);
        this.storeTeacherToken(data.token);
        return { success: true, user: data.user, token: data.token };
      }

      return {
        success: false,
        error: data.error || 'Teacher authentication failed.',
      };
    } catch {
      return { success: false, error: 'Network error while signing in as instructor.' };
    }
  }

  /**
   * Verifies that the active client session holds a valid server-signed Teacher or Admin token.
   */
  static async verifyTeacherSession(): Promise<{ authenticated: boolean; role?: 'teacher' | 'admin' }> {
    const token = this.getStaffToken();
    try {
      const res = await fetch('/api/auth/teacher', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          return { authenticated: true, role: data.user?.role };
        }
      }
    } catch (err) {
      console.warn('Teacher session verification failed:', err);
    }

    this.clearTeacherToken();
    const currentUser = this.getStoredUser();
    if (currentUser?.role === 'teacher') {
      this.clearUser();
    }
    return { authenticated: false };
  }
}
