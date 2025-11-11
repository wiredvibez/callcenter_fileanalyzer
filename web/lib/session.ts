// Session management for analytics
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
  files: Array<{
    name: string;
    url: string;
    size: number;
    content?: string; // For dev mode
  }>;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  analyticsUrl?: string;
  analyticsData?: any; // For dev mode
  error?: string;
}

// In-memory storage (for development)
// In production, use Vercel KV or similar
const sessions = new Map<string, Session>();

export function createSession(): Session {
  const id = uuidv4();
  const now = Date.now();
  const session: Session = {
    id,
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    files: [],
    status: 'uploading',
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  
  // Check expiration
  if (Date.now() > session.expiresAt) {
    sessions.delete(id);
    return undefined;
  }
  
  return session;
}

export function updateSession(id: string, updates: Partial<Session>): Session | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  
  const updated = { ...session, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

