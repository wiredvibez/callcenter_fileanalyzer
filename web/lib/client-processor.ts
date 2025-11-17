// Client-side CSV processing - runs entirely in the browser
import { parseCSV } from './analytics/csv-parser';
import { buildTree, buildCallPaths } from './analytics/button-tree';
import { generateAnalytics } from './analytics/analyzer';
import type { AnalyticsData } from './analytics-storage';

export interface ProcessingProgress {
  stage: 'reading' | 'parsing' | 'analyzing' | 'complete';
  filesProcessed: number;
  totalFiles: number;
  currentFile?: string;
  percentage: number;
}

/**
 * Process CSV files entirely in the browser
 * No server calls, no size limits!
 */
export async function processFilesLocally(
  files: File[],
  onProgress?: (progress: ProcessingProgress) => void
): Promise<AnalyticsData> {
  console.log('[CLIENT-PROCESSOR] Starting local processing of', files.length, 'files');
  
  const allNodes = new Map();
  const allParentMap = new Map();
  const allChildrenMap = new Map();
  const allCallEvents = new Map();
  const allCallMeta = new Map();
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    onProgress?.({
      stage: 'reading',
      filesProcessed: i,
      totalFiles: files.length,
      currentFile: file.name,
      percentage: (i / files.length) * 30,
    });
    
    console.log(`[CLIENT-PROCESSOR] Reading file ${i + 1}/${files.length}: ${file.name}`);
    
    // Read file content
    const csvContent = await file.text();
    
    onProgress?.({
      stage: 'parsing',
      filesProcessed: i,
      totalFiles: files.length,
      currentFile: file.name,
      percentage: 30 + (i / files.length) * 40,
    });
    
    console.log(`[CLIENT-PROCESSOR] Parsing ${file.name} (${csvContent.length} chars)`);
    
    // Parse CSV (runs in browser)
    const { nodes, parentMap, childrenMap, callEvents, callMeta } = await parseCSV(csvContent);
    
    console.log(`[CLIENT-PROCESSOR] Parsed ${file.name}:`, {
      nodes: nodes.size,
      calls: callEvents.size,
    });
    
    // Merge data from all files
    nodes.forEach((node, id) => {
      if (!allNodes.has(id)) {
        allNodes.set(id, node);
        allParentMap.set(id, parentMap.get(id)!);
      }
    });
    
    childrenMap.forEach((children, parentId) => {
      if (!allChildrenMap.has(parentId)) {
        allChildrenMap.set(parentId, new Set());
      }
      children.forEach(childId => {
        allChildrenMap.get(parentId)!.add(childId);
      });
    });
    
    callEvents.forEach((events, callId) => {
      const key = `${file.name}::${callId}`;
      allCallEvents.set(key, events);
      allCallMeta.set(key, callMeta.get(callId)!);
    });
  }
  
  onProgress?.({
    stage: 'analyzing',
    filesProcessed: files.length,
    totalFiles: files.length,
    percentage: 70,
  });
  
  console.log('[CLIENT-PROCESSOR] Building analytics structures');
  console.log('[CLIENT-PROCESSOR] Total nodes:', allNodes.size);
  console.log('[CLIENT-PROCESSOR] Total calls:', allCallEvents.size);
  
  // Build tree and paths
  const buttonTree = buildTree(allNodes, allChildrenMap);
  const callPaths = buildCallPaths(allNodes, allCallEvents, allCallMeta);
  
  // Convert call paths to array for analytics
  const pathsArray = Object.values(callPaths) as any[];
  
  onProgress?.({
    stage: 'analyzing',
    filesProcessed: files.length,
    totalFiles: files.length,
    percentage: 85,
  });
  
  console.log('[CLIENT-PROCESSOR] Generating analytics');
  
  // Generate analytics
  const analyticsData = generateAnalytics(pathsArray, allNodes, allChildrenMap);
  
  onProgress?.({
    stage: 'complete',
    filesProcessed: files.length,
    totalFiles: files.length,
    percentage: 100,
  });
  
  console.log('[CLIENT-PROCESSOR] Processing complete!');
  
  // Return complete analytics package
  return {
    button_tree: buttonTree,
    call_paths: callPaths,
    ...analyticsData,
    files_processed: files.length,
    total_nodes: allNodes.size,
    total_calls: allCallEvents.size,
    uploadedAt: Date.now(),
    fileNames: files.map(f => f.name),
  };
}

