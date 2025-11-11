import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '../../../lib/session';
import { parseCSV } from '../../../lib/analytics/csv-parser';
import { buildTree, buildCallPaths } from '../../../lib/analytics/button-tree';
import { generateAnalytics } from '../../../lib/analytics/analyzer';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update status
    updateSession(sessionId, { status: 'processing' });

    // Fetch and process each CSV
    const allNodes = new Map();
    const allParentMap = new Map();
    const allChildrenMap = new Map();
    const allCallEvents = new Map();
    const allCallMeta = new Map();

    for (const file of session.files) {
      try {
        // Fetch CSV from Blob
        const response = await fetch(file.url);
        const csvContent = await response.text();

        // Parse CSV
        const { nodes, parentMap, childrenMap, callEvents, callMeta } = 
          await parseCSV(csvContent);

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
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files
      }
    }

    // Build tree and paths
    const buttonTree = buildTree(allNodes, allChildrenMap);
    const callPaths = buildCallPaths(allNodes, allCallEvents, allCallMeta);

    // Convert call paths to array for analytics
    const pathsArray = Object.values(callPaths) as any[];

    // Generate full analytics
    const analyticsData = generateAnalytics(pathsArray as any, allNodes, allChildrenMap);

    // Prepare final analytics package
    const analytics = {
      button_tree: buttonTree,
      call_paths: callPaths,
      ...analyticsData,
      files_processed: session.files.length,
      total_nodes: allNodes.size,
      total_calls: allCallEvents.size,
    };

    // Upload main analytics to Blob
    const analyticsBlob = await put(
      `${sessionId}/analytics.json`,
      JSON.stringify(analytics),
      {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      }
    );

    // Also upload individual analytics files for compatibility
    await Promise.all([
      put(`${sessionId}/summary.json`, JSON.stringify({
        lengths_summary: analyticsData.lengths_summary,
        top_intents_top10: analyticsData.top_intents_top10,
        weekday_trends: analyticsData.weekday_trends,
      }), { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/branch_distribution.top10.json`, JSON.stringify(analyticsData.branch_distribution), 
        { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/node_funnel.json`, JSON.stringify(analyticsData.node_funnel),
        { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/button_tree.all.json`, JSON.stringify(buttonTree),
        { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/entropy_complexity.top20.json`, JSON.stringify(analyticsData.entropy_complexity_top20),
        { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/dead_ends.top20.json`, JSON.stringify(analyticsData.dead_ends_top20),
        { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/leaf_frequency.top20.json`, JSON.stringify(analyticsData.leaf_frequency_top20),
        { access: 'public', addRandomSuffix: false }),
      
      put(`${sessionId}/top_paths.top20.json`, JSON.stringify(analyticsData.top_paths_top20),
        { access: 'public', addRandomSuffix: false }),
    ]);

    // Update session
    updateSession(sessionId, {
      status: 'completed',
      analyticsUrl: analyticsBlob.url,
    });

    return NextResponse.json({
      sessionId,
      status: 'completed',
      analyticsUrl: analyticsBlob.url,
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;

