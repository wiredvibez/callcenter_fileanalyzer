import { NextRequest, NextResponse } from 'next/server';
import { parseCSV } from '../../../lib/analytics/csv-parser';
import { buildTree, buildCallPaths } from '../../../lib/analytics/button-tree';
import { generateAnalytics } from '../../../lib/analytics/analyzer';

/**
 * Combined upload and process endpoint
 * Receives CSV files, processes them, and returns complete analytics data
 * No server-side session storage - returns everything to client
 */
export async function POST(request: NextRequest) {
  console.log('[API/UPLOAD-PROCESS] POST request received');
  
  try {
    // Extract files from FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    console.log('[API/UPLOAD-PROCESS] Files received:', files.length);

    if (files.length === 0) {
      console.error('[API/UPLOAD-PROCESS] No files in FormData');
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log('[API/UPLOAD-PROCESS] File names:', files.map(f => f.name));
    console.log('[API/UPLOAD-PROCESS] File sizes:', files.map(f => f.size));

    // Validate files
    for (const file of files) {
      if (!file.name.endsWith('.csv')) {
        console.error('[API/UPLOAD-PROCESS] Invalid file type:', file.name);
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only CSV files are allowed.` },
          { status: 400 }
        );
      }
    }

    // Read all file contents
    console.log('[API/UPLOAD-PROCESS] Reading file contents');
    const fileContents = await Promise.all(
      files.map(async (file) => {
        console.log(`[API/UPLOAD-PROCESS] Reading: ${file.name}`);
        const content = await file.text();
        console.log(`[API/UPLOAD-PROCESS] ${file.name} - ${content.length} characters`);
        return {
          name: file.name,
          content,
          size: file.size,
        };
      })
    );

    // Process all CSV files
    console.log('[API/UPLOAD-PROCESS] Processing CSV files');
    const allNodes = new Map();
    const allParentMap = new Map();
    const allChildrenMap = new Map();
    const allCallEvents = new Map();
    const allCallMeta = new Map();

    for (const file of fileContents) {
      try {
        console.log(`[API/UPLOAD-PROCESS] Parsing: ${file.name}`);
        
        const { nodes, parentMap, childrenMap, callEvents, callMeta } = 
          await parseCSV(file.content);
        
        console.log(`[API/UPLOAD-PROCESS] Parsed ${file.name}:`, {
          nodes: nodes.size,
          calls: callEvents.size
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
      } catch (error) {
        console.error(`[API/UPLOAD-PROCESS] Error processing ${file.name}:`, error);
        console.error(`[API/UPLOAD-PROCESS] Error stack:`, error instanceof Error ? error.stack : 'N/A');
        
        // Return error for individual file
        return NextResponse.json(
          { 
            error: `Failed to process ${file.name}`,
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    console.log('[API/UPLOAD-PROCESS] All files processed');
    console.log('[API/UPLOAD-PROCESS] Total nodes:', allNodes.size);
    console.log('[API/UPLOAD-PROCESS] Total calls:', allCallEvents.size);

    // Build tree and call paths
    console.log('[API/UPLOAD-PROCESS] Building button tree');
    const buttonTree = buildTree(allNodes, allChildrenMap);
    console.log('[API/UPLOAD-PROCESS] Button tree - root nodes:', Object.keys(buttonTree).length);
    
    console.log('[API/UPLOAD-PROCESS] Building call paths');
    const callPaths = buildCallPaths(allNodes, allCallEvents, allCallMeta);
    console.log('[API/UPLOAD-PROCESS] Call paths built:', Object.keys(callPaths).length);

    // Convert call paths to array for analytics
    const pathsArray = Object.values(callPaths) as any[];
    console.log('[API/UPLOAD-PROCESS] Paths array count:', pathsArray.length);

    // Generate full analytics
    console.log('[API/UPLOAD-PROCESS] Generating analytics');
    const analyticsData = generateAnalytics(pathsArray as any, allNodes, allChildrenMap);
    console.log('[API/UPLOAD-PROCESS] Analytics generated successfully');

    // Prepare complete analytics package for client
    const analytics = {
      button_tree: buttonTree,
      call_paths: callPaths,
      ...analyticsData,
      files_processed: files.length,
      total_nodes: allNodes.size,
      total_calls: allCallEvents.size,
      uploadedAt: Date.now(),
      fileNames: files.map(f => f.name),
    };

    console.log('[API/UPLOAD-PROCESS] Returning analytics to client');
    console.log('[API/UPLOAD-PROCESS] Analytics package size:', 
      JSON.stringify(analytics).length, 'characters');

    // Return complete analytics - no server-side storage!
    return NextResponse.json({
      success: true,
      analytics,
      summary: {
        filesProcessed: files.length,
        totalNodes: allNodes.size,
        totalCalls: allCallEvents.size,
      }
    });

  } catch (error) {
    console.error('[API/UPLOAD-PROCESS] Processing error:', error);
    console.error('[API/UPLOAD-PROCESS] Error stack:', error instanceof Error ? error.stack : 'N/A');
    
    return NextResponse.json(
      { 
        error: 'Processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;

