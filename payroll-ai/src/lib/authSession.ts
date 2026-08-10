// src/lib/authSession.ts
/**
 * Helper module for managing user session state & chat vector DB session scoping.
 */

const API_BASE = 'http://localhost:8000';
const SESSION_KEY = 'payroll_ai_session_id';
const USER_KEY = 'payroll_ai_user';

export interface UserSession {
  email: string;
  name: string;
  role: string;
  sessionId: string;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'default_session';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function createNewSession(email: string = 'admin@payrollai.com', name: string = 'HR Admin'): UserSession {
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const user: UserSession = {
    email,
    name,
    role: 'Administrator',
    sessionId: newSessionId,
  };
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, newSessionId);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  return user;
}

export function getCurrentUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const userStr = sessionStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function clearSessionChat(sessionId?: string): Promise<boolean> {
  const targetSessionId = sessionId || getSessionId();
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: targetSessionId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to clear session chat on backend:', err);
    return false;
  }
}

export async function logoutSession(routerNavigate?: (path: string) => void): Promise<void> {
  const currentSessionId = getSessionId();
  
  // 1. Purge session vector database records on backend
  await clearSessionChat(currentSessionId);

  // 2. Clear local session storage
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  // 3. Navigate to login page
  if (routerNavigate) {
    routerNavigate('/login');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
