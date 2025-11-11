// Build button tree from parsed data
import { TreeNode, NodeData } from './types';

export function buildTree(
  nodes: Map<number, NodeData>,
  childrenMap: Map<number, Set<number>>
): TreeNode[] {
  // Find roots (parent_id === 0)
  const roots: NodeData[] = [];
  nodes.forEach((node) => {
    if (node.parent_id === 0) {
      roots.push(node);
    }
  });

  function expand(node: NodeData): TreeNode {
    const nodeId = node.rule_id;
    const children: TreeNode[] = [];
    
    const childIds = childrenMap.get(nodeId);
    if (childIds && childIds.size > 0) {
      // Sort children by text then by rule_id
      const sortedChildren = Array.from(childIds)
        .map(id => nodes.get(id)!)
        .filter(Boolean)
        .sort((a, b) => {
          const textCmp = a.text.localeCompare(b.text, 'he');
          return textCmp !== 0 ? textCmp : a.rule_id - b.rule_id;
        });

      for (const childNode of sortedChildren) {
        children.push(expand(childNode));
      }
    }

    return {
      rule_id: node.rule_id,
      parent_id: node.parent_id,
      text: node.text,
      url: node.url,
      children: children.length > 0 ? children : undefined,
    };
  }

  // Sort roots
  const sortedRoots = roots.sort((a, b) => {
    const textCmp = a.text.localeCompare(b.text, 'he');
    return textCmp !== 0 ? textCmp : a.rule_id - b.rule_id;
  });

  return sortedRoots.map(expand);
}

export function buildCallPaths(
  nodes: Map<number, NodeData>,
  callEvents: Map<string, Array<{ seq: number; rule_id: number }>>,
  callMeta: Map<string, { call_date: string | null; weekday: number | null }>
) {
  const callPaths: any = {};

  callEvents.forEach((events, callId) => {
    // Sort by sequence
    const sorted = events.sort((a, b) => a.seq - b.seq);
    
    // Remove duplicates (keep first occurrence of each rule_id in sequence)
    const path: Array<{ rule_id: number; text: string; url: string | null }> = [];
    let lastRuleId = -1;
    
    for (const event of sorted) {
      if (event.rule_id !== lastRuleId) {
        const node = nodes.get(event.rule_id);
        if (node) {
          path.push({
            rule_id: node.rule_id,
            text: node.text,
            url: node.url,
          });
          lastRuleId = event.rule_id;
        }
      }
    }

    const meta = callMeta.get(callId) || { call_date: null, weekday: null };
    const key = `call::${callId}`;
    
    callPaths[key] = {
      source_call: key,
      call_id: callId,
      call_date: meta.call_date,
      weekday: meta.weekday,
      path,
    };
  });

  return callPaths;
}

