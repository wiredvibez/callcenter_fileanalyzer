import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '../../../lib/session';
import { parseCSV } from '../../../lib/analytics/csv-parser';
import { buildTree, buildCallPaths } from '../../../lib/analytics/button-tree';
import { generateAnalytics } from '../../../lib/analytics/analyzer';

export async function POST(request: NextRequest) {
  console.log('[API/PROCESS] POST request received');
  try {
    const body = await request.json();
    console.log('[API/PROCESS] Request body:', body);
    const { sessionId } = body;

    if (!sessionId) {
      console.error('[API/PROCESS] No sessionId provided');
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    console.log('[API/PROCESS] Looking up session:', sessionId);
    
    const session = getSession(sessionId);
    if (!session) {
      console.error('[API/PROCESS] Session not found:', sessionId);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('[API/PROCESS] Session found:', {
      id: session.id,
      status: session.status,
      filesCount: session.files.length,
      files: session.files.map(f => ({ name: f.name, size: f.size }))
    });

    // Update status
    console.log('[API/PROCESS] Updating session status to processing');
    updateSession(sessionId, { status: 'processing' });

    // Fetch and process each CSV
    console.log('[API/PROCESS] Starting CSV processing for', session.files.length, 'files');
    const allNodes = new Map();
    const allParentMap = new Map();
    const allChildrenMap = new Map();
    const allCallEvents = new Map();
    const allCallMeta = new Map();

    for (const file of session.files) {
      try {
        console.log(`[API/PROCESS] Processing file: ${file.name}`);
        
        // Read content from memory
        const csvContent = file.content;
        console.log(`[API/PROCESS] CSV content length for ${file.name}:`, csvContent.length);
        
        // Parse CSV
        console.log(`[API/PROCESS] Parsing CSV: ${file.name}`);
        const { nodes, parentMap, childrenMap, callEvents, callMeta } = 
          await parseCSV(csvContent);
        
        console.log(`[API/PROCESS] Parsed ${file.name}:`, {
          nodesCount: nodes.size,
          callEventsCount: callEvents.size
        });

        // Merge data
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
        console.error(`[API/PROCESS] Error processing file ${file.name}:`, error);
        console.error(`[API/PROCESS] Error stack:`, error instanceof Error ? error.stack : 'N/A');
        // Continue with other files
      }
    }

    console.log('[API/PROCESS] All files processed. Total nodes:', allNodes.size);
    console.log('[API/PROCESS] Total call events:', allCallEvents.size);

    // Build tree and paths
    console.log('[API/PROCESS] Building button tree');
    const buttonTree = buildTree(allNodes, allChildrenMap);
    console.log('[API/PROCESS] Button tree built. Root nodes:', Object.keys(buttonTree).length);
    
    console.log('[API/PROCESS] Building call paths');
    const callPaths = buildCallPaths(allNodes, allCallEvents, allCallMeta);
    console.log('[API/PROCESS] Call paths built:', Object.keys(callPaths).length);

    // Convert call paths to array for analytics
    const pathsArray = Object.values(callPaths) as any[];
    console.log('[API/PROCESS] Converting paths to array. Count:', pathsArray.length);

    // Generate full analytics
    console.log('[API/PROCESS] Generating analytics');
    const analyticsData = generateAnalytics(pathsArray as any, allNodes, allChildrenMap);
    console.log('[API/PROCESS] Analytics generated');

    // Prepare final analytics package
    const analytics = {
      button_tree: buttonTree,
      call_paths: callPaths,
      ...analyticsData,
      files_processed: session.files.length,
      total_nodes: allNodes.size,
      total_calls: allCallEvents.size,
    };

    // Store analytics in session memory
    console.log('[API/PROCESS] Storing analytics in session memory');
    updateSession(sessionId, {
      status: 'completed',
      analyticsData: analytics,
    });

    console.log('[API/PROCESS] Processing completed successfully');
    return NextResponse.json({
      sessionId,
      status: 'completed',
    });
  } catch (error) {
    console.error('[API/PROCESS] Processing error:', error);
    console.error('[API/PROCESS] Error stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('[API/PROCESS] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
