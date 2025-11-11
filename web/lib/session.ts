// Session management for analytics
import { v4 as uuidv4 } from 'uuid';
import { put, head } from '@vercel/blob';

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
// Use globalThis to ensure the Map is shared across all API routes in development
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
  // Fallback for environments without globalThis
  return new Map<string, Session>();
};

const sessions = getSessionsMap();

const isDev = process.env.NODE_ENV === 'development';

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
  
  console.log('[SESSION] Creating new session:', id);
  console.log('[SESSION] Environment:', isDev ? 'Development' : 'Production');
  
  if (isDev) {
    sessions.set(id, session);
    console.log('[SESSION] Session stored in memory. Total sessions:', sessions.size);
  }
  
  return session;
}

export async function getSession(id: string): Promise<Session | undefined> {
  console.log('[SESSION] Getting session:', id);
  console.log('[SESSION] Environment:', isDev ? 'Development' : 'Production');
  
  // Development: use in-memory storage
  if (isDev) {
    console.log('[SESSION] Looking up in memory storage. Total sessions:', sessions.size);
    console.log('[SESSION] Available session IDs:', Array.from(sessions.keys()));
    
    const session = sessions.get(id);
    if (!session) {
      console.error('[SESSION] Session not found in memory:', id);
      return undefined;
    }
    
    // Check expiration
    if (Date.now() > session.expiresAt) {
      console.error('[SESSION] Session expired:', id);
      sessions.delete(id);
      return undefined;
    }
    
    console.log('[SESSION] Session found:', {
      id: session.id,
      status: session.status,
      filesCount: session.files.length
    });
    return session;
  }

  // Production: fetch from Blob storage
  console.log('[SESSION] Fetching from Blob storage');
  try {
    const url = `${process.env.BLOB_READ_WRITE_TOKEN ? 'https://' : ''}${process.env.VERCEL_URL || 'vercel.app'}/api/blob/${id}/session.json`;
    console.log('[SESSION] Trying primary URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log('[SESSION] Primary URL failed, trying alternative');
      // Try alternative: direct blob URL
      const blobUrl = `https://blob.vercel-storage.com/sessions/${id}/session.json`;
      console.log('[SESSION] Trying alternative URL:', blobUrl);
      const blobResponse = await fetch(blobUrl);
      
      if (!blobResponse.ok) {
        console.error('[SESSION] Alternative URL also failed');
        return undefined;
      }
      
      const session = await blobResponse.json();
      console.log('[SESSION] Session found via alternative URL');
      
      // Check expiration
      if (Date.now() > session.expiresAt) {
        console.error('[SESSION] Session expired');
        return undefined;
      }
      
      return session;
    }
    
    const session = await response.json();
    console.log('[SESSION] Session found via primary URL');
    
    // Check expiration
    if (Date.now() > session.expiresAt) {
      console.error('[SESSION] Session expired');
      return undefined;
    }
    
    return session;
  } catch (error) {
    console.error('[SESSION] Error fetching session:', error);
    console.error('[SESSION] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return undefined;
  }
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
  console.log('[SESSION] Updating session:', id);
  console.log('[SESSION] Updates:', updates);
  
  // Development: use in-memory storage
  if (isDev) {
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

  // Production: update in Blob storage
  console.log('[SESSION] Updating in Blob storage');
  try {
    // Fetch current session
    const current = await getSession(id);
    if (!current) {
      console.error('[SESSION] Current session not found for update');
      return undefined;
    }
    
    const updated = { ...current, ...updates };
    console.log('[SESSION] Uploading updated session to Blob');
    
    // Store in Blob
    await put(`sessions/${id}/session.json`, JSON.stringify(updated), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    
    console.log('[SESSION] Session updated in Blob storage');
    return updated;
  } catch (error) {
    console.error('[SESSION] Error updating session:', error);
    console.error('[SESSION] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return undefined;
  }
}

export async function saveSession(session: Session): Promise<void> {
  console.log('[SESSION] Saving session:', session.id);
  console.log('[SESSION] Environment:', isDev ? 'Development' : 'Production');
  
  if (isDev) {
    sessions.set(session.id, session);
    console.log('[SESSION] Session saved in memory. Total sessions:', sessions.size);
    return;
  }

  // Production: save to Blob storage
  console.log('[SESSION] Saving to Blob storage');
  try {
    await put(`sessions/${session.id}/session.json`, JSON.stringify(session), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    console.log('[SESSION] Session saved to Blob storage');
  } catch (error) {
    console.error('[SESSION] Error saving session:', error);
    console.error('[SESSION] Error stack:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

