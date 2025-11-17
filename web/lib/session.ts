// Session management for analytics (in-memory only)
import { v4 as uuidv4 } from 'uuid';

export interface Session {
  id: string;
  createdAt: number;
  files: Array<{
    name: string;
    size: number;
    content: string; // CSV content stored in memory
  }>;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  analyticsData?: any; // All analytics stored in memory
  error?: string;
}

// In-memory storage using globalThis to share across API routes
const getSessionsMap = (): Map<string, Session> => {
  if (typeof globalThis !== 'undefined') {
    // @ts-ignore
    if (!globalThis.__sessions__) {
      // @ts-ignore
      globalThis.__sessions__ = new Map<string, Session>();
      console.log('[SESSION] Initialized global sessions Map');
    }
    // @ts-ignore
    return globalThis.__sessions__;
  }
  return new Map<string, Session>();
};

const sessions = getSessionsMap();

export function createSession(): Session {
  const id = uuidv4();
  const session: Session = {
    id,
    createdAt: Date.now(),
    files: [],
    status: 'uploading',
  };
  
  console.log('[SESSION] Creating new session:', id);
  sessions.set(id, session);
  console.log('[SESSION] Session stored in memory. Total sessions:', sessions.size);
  
  return session;
}

export function getSession(id: string): Session | undefined {
  console.log('[SESSION] Getting session:', id);
  console.log('[SESSION] Available session IDs:', Array.from(sessions.keys()));
  
  const session = sessions.get(id);
  if (!session) {
    console.error('[SESSION] Session not found in memory:', id);
    return undefined;
  }
  
  console.log('[SESSION] Session found:', {
    id: session.id,
    status: session.status,
    filesCount: session.files.length
  });
  return session;
}

export function updateSession(id: string, updates: Partial<Session>): Session | undefined {
  console.log('[SESSION] Updating session:', id);
  console.log('[SESSION] Updates:', updates);
  
  const session = sessions.get(id);
  if (!session) {
    console.error('[SESSION] Session not found for update:', id);
    return undefined;
  }
  
  const updated = { ...session, ...updates };
  sessions.set(id, updated);
  console.log('[SESSION] Session updated in memory');
  return updated;
}

export function saveSession(session: Session): void {
  console.log('[SESSION] Saving session:', session.id);
  sessions.set(session.id, session);
  console.log('[SESSION] Session saved in memory. Total sessions:', sessions.size);
}

export function deleteSession(id: string): boolean {
  console.log('[SESSION] Deleting session:', id);
  return sessions.delete(id);
}

export function listSessions(): Session[] {
  return Array.from(sessions.values());
}
