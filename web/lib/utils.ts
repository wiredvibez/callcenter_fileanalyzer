export function analyticsPath(file: string) {
  // Resolve ../analytics relative to the Next.js project root
  return require("path").resolve(process.cwd(), "..", "analytics", file);
}

export async function readJson<T = unknown>(file: string, sessionId?: string): Promise<T> {
  // If sessionId provided, fetch from Blob storage
  if (sessionId) {
    try {
      const blobUrl = process.env.NEXT_PUBLIC_BLOB_URL || process.env.BLOB_READ_WRITE_TOKEN?.split('@')[1];
      const url = blobUrl 
        ? `https://${blobUrl}/${sessionId}/${file}`
        : `${sessionId}/${file}`;
      
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${file}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error(`Error fetching ${file} for session ${sessionId}:`, error);
      throw error;
    }
  }
  
  // Otherwise, read from local filesystem
  const fs = await import("node:fs/promises");
  const p = analyticsPath(file);
  const data = await fs.readFile(p, "utf-8");
  return JSON.parse(data) as T;
}


