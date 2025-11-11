// CSV parsing utilities
import { NodeData, CallPath } from './types';

export interface CSVRow {
  call_id: string;
  call_date: string;
  rule_id: string;
  rule_parent_id: string;
  rule_text: string;
  popUpURL: string;
}

function coerceNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = value.trim();
  if (s === '' || s.toUpperCase() === 'NULL') return null;
  return s;
}

function parseDate(dateStr: string | null): { date: string | null; weekday: number | null } {
  if (!dateStr) return { date: null, weekday: null };
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { date: null, weekday: null };
    
    // getDay() returns 0-6 (Sun-Sat), convert to 1-7 (Mon-Sun)
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    return { date: dateStr, weekday };
  } catch {
    return { date: null, weekday: null };
  }
}

export async function parseCSV(csvContent: string): Promise<{
  nodes: Map<number, NodeData>;
  parentMap: Map<number, number>;
  childrenMap: Map<number, Set<number>>;
  callEvents: Map<string, Array<{ seq: number; rule_id: number }>>;
  callMeta: Map<string, { call_date: string | null; weekday: number | null }>;
}> {
  const nodes = new Map<number, NodeData>();
  const parentMap = new Map<number, number>();
  const childrenMap = new Map<number, Set<number>>();
  const callEvents = new Map<string, Array<{ seq: number; rule_id: number }>>();
  const callMeta = new Map<string, { call_date: string | null; weekday: number | null }>();

  // Parse CSV (simple implementation)
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  let seq = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (doesn't handle quoted commas - enhance if needed)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    seq++;

    const callId = row.call_id?.trim();
    const callDate = row.call_date?.trim();
    
    if (callId && !callMeta.has(callId)) {
      const { date, weekday } = parseDate(callDate);
      callMeta.set(callId, { call_date: date, weekday });
    }

    // Parse IDs
    const ruleId = parseInt(row.rule_id?.trim() || '0');
    const parentId = parseInt(row.rule_parent_id?.trim() || '0');

    if (isNaN(ruleId) || ruleId === 0) continue;

    const text = coerceNull(row.rule_text) || '';
    const url = coerceNull(row.popUpURL);

    // Register node (prefer first-seen)
    if (!nodes.has(ruleId)) {
      nodes.set(ruleId, {
        rule_id: ruleId,
        parent_id: parentId,
        text,
        url,
      });
      parentMap.set(ruleId, parentId);
    }

    // Build structure link
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, new Set());
    }
    childrenMap.get(parentId)!.add(ruleId);

    // Track call events
    if (callId) {
      if (!callEvents.has(callId)) {
        callEvents.set(callId, []);
      }
      callEvents.get(callId)!.push({ seq, rule_id: ruleId });
    }
  }

  return { nodes, parentMap, childrenMap, callEvents, callMeta };
}

