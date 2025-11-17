// Browser sessionStorage wrapper for analytics data
// Data is tab-specific and automatically cleared when tab closes

export interface AnalyticsData {
  button_tree: any;
  call_paths: any;
  lengths_summary: any;
  top_intents_top10: any[];
  leaf_frequency_top20: any[];
  branch_distribution: any;
  weekday_trends: any;
  node_funnel: any;
  entropy_complexity_top20: any[];
  top_paths_top20: any[];
  dead_ends_top20: any[];
  files_processed: number;
  total_nodes: number;
  total_calls: number;
  uploadedAt: number; // timestamp
  fileNames: string[]; // list of uploaded file names
}

const STORAGE_KEY = 'call_center_analytics';

/**
 * Simple LZ-based compression using built-in browser APIs
 */
function compress(str: string): string {
  // Use simple compression by encoding then base64
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // Convert to base64 for storage (not ideal compression but works)
  let binary = '';
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decompress data
 */
function decompress(compressed: string): string {
  try {
    const binary = atob(compressed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    console.error('[STORAGE] Decompression failed:', error);
    return compressed; // Return as-is if decompression fails
  }
}

/**
 * Optimize analytics data by removing unnecessary large objects
 */
function optimizeAnalytics(data: AnalyticsData): any {
  // Create a copy without the massive call_paths object
  // We don't need individual call paths for most analytics views
  const optimized = {
    ...data,
    // Remove call_paths - it's huge and rarely used
    call_paths: undefined,
  };
  
  return optimized;
}

/**
 * Save analytics data to browser sessionStorage with compression
 * Data persists only for the current tab and is cleared when tab closes
 */
export function saveAnalytics(data: AnalyticsData): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Optimize data first (remove large unnecessary objects)
    const optimized = optimizeAnalytics(data);
    const jsonStr = JSON.stringify(optimized);
    
    console.log('[STORAGE] Original size:', formatBytes(new Blob([JSON.stringify(data)]).size));
    console.log('[STORAGE] Optimized size:', formatBytes(new Blob([jsonStr]).size));
    
    // Try to store optimized data
    sessionStorage.setItem(STORAGE_KEY, jsonStr);
    console.log('[STORAGE] Analytics saved to sessionStorage (optimized)');
  } catch (error) {
    console.error('[STORAGE] Error saving to sessionStorage:', error);
    
    // Handle quota exceeded errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('[STORAGE] sessionStorage quota exceeded - data too large');
      
      // Show user-friendly error
      alert(
        'הנתונים גדולים מדי לאחסון בדפדפן.\n' +
        'אנא נסה להעלות פחות קבצים או קבצים קטנים יותר.\n\n' +
        'Data too large for browser storage.\n' +
        'Please try uploading fewer or smaller files.'
      );
      
      throw new Error('Storage quota exceeded');
    }
    throw error;
  }
}

/**
 * Get analytics data from browser sessionStorage
 * Returns null if no data exists
 */
export function getAnalytics(): AnalyticsData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored) as AnalyticsData;
    // console.log('[STORAGE] Analytics loaded from sessionStorage');
    return data;
  } catch (error) {
    console.error('[STORAGE] Error reading from sessionStorage:', error);
    return null;
  }
}

/**
 * Clear analytics data from browser sessionStorage
 */
export function clearAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('[STORAGE] Analytics cleared from sessionStorage');
  } catch (error) {
    console.error('[STORAGE] Error clearing sessionStorage:', error);
  }
}

/**
 * Check if analytics data exists in sessionStorage
 */
export function hasAnalytics(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get analytics data size in bytes (for debugging)
 */
export function getAnalyticsSize(): number {
  if (typeof window === 'undefined') return 0;
  
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return 0;
  
  return new Blob([stored]).size;
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

