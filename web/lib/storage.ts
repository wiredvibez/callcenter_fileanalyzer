// Storage utilities for Vercel Blob
import { put, list, del } from '@vercel/blob';

export interface UploadedFile {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export async function uploadFile(file: File, sessionId: string): Promise<UploadedFile> {
  const pathname = `${sessionId}/${file.name}`;
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: file.type,
    size: file.size,
  };
}

export async function uploadAnalytics(sessionId: string, data: any): Promise<string> {
  const pathname = `${sessionId}/analytics.json`;
  const blob = await put(pathname, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  return blob.url;
}

export async function getSessionFiles(sessionId: string) {
  const { blobs } = await list({
    prefix: `${sessionId}/`,
  });
  return blobs;
}

export async function deleteSession(sessionId: string) {
  const files = await getSessionFiles(sessionId);
  await Promise.all(files.map(file => del(file.url)));
}

