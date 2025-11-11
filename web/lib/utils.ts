export function analyticsPath(file: string) {
  // Resolve ../analytics relative to the Next.js project root
  return require("path").resolve(process.cwd(), "..", "analytics", file);
}

export async function readJson<T = unknown>(file: string, sessionId?: string): Promise<T> {
  // If sessionId provided, fetch from session or Blob storage
  if (sessionId) {
    try {
      // In development, try to get from session first
      if (process.env.NODE_ENV === 'development') {
        const { getSession } = await import('./session');
        const session = getSession(sessionId);
        
        if (session?.analyticsData) {
          // Extract the specific file from analytics data
          const data = session.analyticsData;
          
          // Map file names to analytics data properties
          const fileMap: Record<string, any> = {
            'summary.json': {
              lengths_summary: data.lengths_summary,
              top_intents_top10: data.top_intents_top10,
              weekday_trends: data.weekday_trends,
            },
            'branch_distribution.top10.json': data.branch_distribution,
            'node_funnel.json': data.node_funnel,
            'button_tree.all.json': data.button_tree,
            'entropy_complexity.top20.json': data.entropy_complexity_top20,
            'dead_ends.top20.json': data.dead_ends_top20,
            'leaf_frequency.top20.json': data.leaf_frequency_top20,
            'top_paths.top20.json': data.top_paths_top20,
            'weekday_trends.json': data.weekday_trends,
            'top_intents.json': data.top_intents_top10,
            'anomalies.json': [],
            'coverage_ratio.json': {},
            'entropy_complexity.json': {},
            'dead_ends.json': data.dead_ends_top20 || [],
            'depth_funnel.json': {},
            'duplicates_by_text.json': {},
            'unreachable_nodes.json': [],
            'url_engagement.json': [],
          };
          
          if (fileMap[file] !== undefined) {
            return fileMap[file] as T;
          }
        }
      }
      
      // Production or file not in session: fetch from Blob storage
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


