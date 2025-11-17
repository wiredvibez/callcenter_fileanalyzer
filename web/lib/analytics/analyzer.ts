// Analytics generation from call paths
import { TreeNode, CallPath } from './types';

interface PathData {
  source_call: string;
  call_id: string;
  call_date: string | null;
  weekday: number | null;
  path: Array<{ rule_id: number; text: string; url: string | null }>;
}

function pathRuleIds(path: PathData['path']): number[] {
  return path.map(step => step.rule_id);
}

// Lengths summary
export function summarizeLengths(paths: PathData[]) {
  const lengths = paths.map(p => p.path.length);
  if (lengths.length === 0) return {};
  
  lengths.sort((a, b) => a - b);
  const n = lengths.length;
  
  const percentile = (p: number) => {
    if (n === 0) return 0;
    const idx = Math.min(n - 1, Math.max(0, Math.ceil(p * n) - 1));
    return lengths[idx];
  };
  
  const sum = lengths.reduce((a, b) => a + b, 0);
  
  return {
    count: n,
    avg: sum / n,
    median: percentile(0.5),
    p90: percentile(0.9),
    p95: percentile(0.95),
    min: lengths[0],
    max: lengths[n - 1],
  };
}

// Top intents (first node in path)
export function topIntents(paths: PathData[]) {
  const counts = new Map<number, number>();
  
  for (const p of paths) {
    const rids = pathRuleIds(p.path);
    if (rids.length === 0) continue;
    
    // If first is 1 (root), take second; otherwise take first
    const intent = rids.length > 1 && rids[0] === 1 ? rids[1] : rids[0];
    counts.set(intent, (counts.get(intent) || 0) + 1);
  }
  
  return Array.from(counts.entries())
    .map(([rule_id, count]) => ({ rule_id, count }))
    .sort((a, b) => b.count - a.count);
}

// Leaf frequency (last node in each path)
export function leafAnalysis(paths: PathData[], nodes: Map<number, any>) {
  const leaves = new Map<number, number>();
  
  for (const p of paths) {
    const rids = pathRuleIds(p.path);
    if (rids.length > 0) {
      const leaf = rids[rids.length - 1];
      leaves.set(leaf, (leaves.get(leaf) || 0) + 1);
    }
  }
  
  return Array.from(leaves.entries())
    .map(([rule_id, count]) => ({ 
      rule_id, 
      count,
      text: nodes.get(rule_id)?.text || String(rule_id)
    }))
    .sort((a, b) => b.count - a.count);
}

// Branch distribution (next step from each node)
export function branchDistribution(paths: PathData[]) {
  const dist = new Map<number, Map<number, number>>();
  
  for (const p of paths) {
    const rids = pathRuleIds(p.path);
    for (let i = 0; i < rids.length - 1; i++) {
      const current = rids[i];
      const next = rids[i + 1];
      
      if (!dist.has(current)) {
        dist.set(current, new Map());
      }
      const nextMap = dist.get(current)!;
      nextMap.set(next, (nextMap.get(next) || 0) + 1);
    }
  }
  
  return dist;
}

// Weekday trends
export function weekdayTrends(paths: PathData[]) {
  const byWeekday = new Map<number | null, number>();
  
  for (const p of paths) {
    const wd = p.weekday;
    byWeekday.set(wd, (byWeekday.get(wd) || 0) + 1);
  }
  
  return Object.fromEntries(byWeekday);
}

// Node funnel (reach, transitions, drop-off)
export function nodeFunnel(paths: PathData[]) {
  const reach = new Map<number, number>();
  const transitions = new Map<number, Map<number, number>>();
  
  for (const p of paths) {
    const rids = pathRuleIds(p.path);
    for (let i = 0; i < rids.length; i++) {
      const rid = rids[i];
      reach.set(rid, (reach.get(rid) || 0) + 1);
      
      if (i < rids.length - 1) {
        const next = rids[i + 1];
        if (!transitions.has(rid)) {
          transitions.set(rid, new Map());
        }
        const nextMap = transitions.get(rid)!;
        nextMap.set(next, (nextMap.get(next) || 0) + 1);
      }
    }
  }
  
  const result: Record<number, { reach: number; transitions: number; drop_off: number }> = {};
  
  reach.forEach((r, rid) => {
    const transMap = transitions.get(rid);
    const transSum = transMap ? Array.from(transMap.values()).reduce((a, b) => a + b, 0) : 0;
    result[rid] = {
      reach: r,
      transitions: transSum,
      drop_off: r - transSum,
    };
  });
  
  return result;
}

// Entropy and complexity
export function entropyComplexity(branchDist: Map<number, Map<number, number>>) {
  const results: Array<{
    rule_id: number;
    entropy_bits: number;
    perplexity: number;
    branching_factor: number;
  }> = [];
  
  branchDist.forEach((nextMap, ruleId) => {
    const total = Array.from(nextMap.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    
    let entropy = 0;
    nextMap.forEach((count) => {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });
    
    const perplexity = Math.pow(2, entropy);
    const branchingFactor = nextMap.size;
    
    results.push({
      rule_id: ruleId,
      entropy_bits: entropy,
      perplexity,
      branching_factor: branchingFactor,
    });
  });
  
  return results.sort((a, b) => b.entropy_bits - a.entropy_bits);
}

// Top paths
export function topPaths(paths: PathData[], limit: number = 20) {
  const pathCounts = new Map<string, number>();
  
  for (const p of paths) {
    const key = pathRuleIds(p.path).join('→');
    pathCounts.set(key, (pathCounts.get(key) || 0) + 1);
  }
  
  return Array.from(pathCounts.entries())
    .map(([path, count]) => ({
      path: path.split('→').map(id => parseInt(id)),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Dead ends
export function deadEnds(
  nodeFunnelData: Record<number, { reach: number; transitions: number; drop_off: number }>,
  childrenMap: Map<number, Set<number>>,
  nodes: Map<number, any>
) {
  const results: Array<{
    rule_id: number;
    reach_occurrences: number;
    terminations: number;
    termination_rate: number;
    has_children: boolean;
    text: string;
  }> = [];
  
  Object.entries(nodeFunnelData).forEach(([ruleIdStr, data]) => {
    const ruleId = parseInt(ruleIdStr);
    const hasChildren = childrenMap.has(ruleId) && childrenMap.get(ruleId)!.size > 0;
    
    if (data.drop_off > 0) {
      results.push({
        rule_id: ruleId,
        reach_occurrences: data.reach,
        terminations: data.drop_off,
        termination_rate: data.drop_off / data.reach,
        has_children: hasChildren,
        text: nodes.get(ruleId)?.text || String(ruleId),
      });
    }
  });
  
  return results.sort((a, b) => b.terminations - a.terminations);
}

// URL engagement (URLs from paths)
export function urlEngagement(paths: PathData[]) {
  const urlCounts = new Map<string, number>();
  
  for (const p of paths) {
    for (const step of p.path) {
      if (step.url) {
        urlCounts.set(step.url, (urlCounts.get(step.url) || 0) + 1);
      }
    }
  }
  
  return Array.from(urlCounts.entries())
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count);
}

// Depth funnel (how many calls reached each depth level)
export function depthFunnel(paths: PathData[]) {
  const depthCounts = new Map<number, number>();
  
  for (const p of paths) {
    const pathLength = p.path.length;
    for (let depth = 1; depth <= pathLength; depth++) {
      depthCounts.set(depth, (depthCounts.get(depth) || 0) + 1);
    }
  }
  
  return Array.from(depthCounts.entries())
    .map(([depth, count]) => ({ depth, count }))
    .sort((a, b) => a.depth - b.depth);
}

// Anomalies (edges observed in paths that don't exist in the tree)
export function detectAnomalies(paths: PathData[], childrenMap: Map<number, Set<number>>, nodes: Map<number, any>) {
  // Build set of valid tree edges
  const treeEdges = new Set<string>();
  childrenMap.forEach((children, parent) => {
    children.forEach(child => {
      treeEdges.add(`${parent}->${child}`);
    });
  });
  
  // Find edges in paths that aren't in tree
  const badEdges = new Map<string, { from: number; to: number; count: number; from_text: string; to_text: string }>();
  
  for (const p of paths) {
    const rids = pathRuleIds(p.path);
    for (let i = 0; i < rids.length - 1; i++) {
      const from = rids[i];
      const to = rids[i + 1];
      const edgeKey = `${from}->${to}`;
      
      if (!treeEdges.has(edgeKey)) {
        if (!badEdges.has(edgeKey)) {
          badEdges.set(edgeKey, { 
            from, 
            to, 
            count: 0,
            from_text: nodes.get(from)?.text || String(from),
            to_text: nodes.get(to)?.text || String(to)
          });
        }
        badEdges.get(edgeKey)!.count++;
      }
    }
  }
  
  return Array.from(badEdges.values())
    .sort((a, b) => b.count - a.count);
}

// Find duplicate node texts (same text, different IDs)
export function duplicatesByText(nodes: Map<number, any>) {
  const textBuckets = new Map<string, number[]>();
  
  nodes.forEach((node, ruleId) => {
    const text = (node.text || '').trim();
    if (text) {
      if (!textBuckets.has(text)) {
        textBuckets.set(text, []);
      }
      textBuckets.get(text)!.push(ruleId);
    }
  });
  
  // Keep only duplicates
  const duplicates: Array<{ text: string; rule_ids: number[] }> = [];
  textBuckets.forEach((ids, text) => {
    if (ids.length > 1) {
      duplicates.push({ text, rule_ids: ids.sort((a, b) => a - b) });
    }
  });
  
  return duplicates.sort((a, b) => b.rule_ids.length - a.rule_ids.length);
}

// Find nodes that never appear in any call path
export function unreachableNodes(
  nodes: Map<number, any>,
  nodeFunnelData: Record<number, { reach: number; transitions: number; drop_off: number }>
) {
  const unreachable: Array<{ rule_id: number; text: string }> = [];
  
  nodes.forEach((node, ruleId) => {
    const reach = nodeFunnelData[ruleId]?.reach || 0;
    if (reach === 0) {
      unreachable.push({
        rule_id: ruleId,
        text: node.text || String(ruleId),
      });
    }
  });
  
  return unreachable.sort((a, b) => a.rule_id - b.rule_id);
}

// Coverage ratio (top-1 and top-2 child coverage for each node)
export function coverageRatio(branches: Map<number, Map<number, number>>) {
  const results: Array<{
    rule_id: number;
    top1_coverage: number;
    top2_coverage: number;
  }> = [];
  
  branches.forEach((nextMap, ruleId) => {
    const total = Array.from(nextMap.values()).reduce((a, b) => a + b, 0);
    if (total === 0) {
      results.push({
        rule_id: ruleId,
        top1_coverage: 0,
        top2_coverage: 0,
      });
      return;
    }
    
    const sorted = Array.from(nextMap.entries())
      .map(([childId, count]) => count)
      .sort((a, b) => b - a);
    
    const top1 = sorted[0] || 0;
    const top2 = top1 + (sorted[1] || 0);
    
    results.push({
      rule_id: ruleId,
      top1_coverage: top1 / total,
      top2_coverage: top2 / total,
    });
  });
  
  return results;
}

// Complete analytics generation
export function generateAnalytics(
  paths: PathData[],
  nodes: Map<number, any>,
  childrenMap: Map<number, Set<number>>
) {
  const lengthsSummary = summarizeLengths(paths);
  const intents = topIntents(paths);
  const leaves = leafAnalysis(paths, nodes);
  const branches = branchDistribution(paths);
  const weekdays = weekdayTrends(paths);
  const funnel = nodeFunnel(paths);
  const entropy = entropyComplexity(branches);
  const paths20 = topPaths(paths, 20);
  const deadEndsData = deadEnds(funnel, childrenMap, nodes);
  const urlEngagementData = urlEngagement(paths);
  const depthFunnelData = depthFunnel(paths);
  const anomaliesData = detectAnomalies(paths, childrenMap, nodes);
  const duplicatesData = duplicatesByText(nodes);
  const unreachableData = unreachableNodes(nodes, funnel);
  const coverageData = coverageRatio(branches);
  
  // Add text to intents
  const intentsWithText = intents.map(item => ({
    ...item,
    text: nodes.get(item.rule_id)?.text || String(item.rule_id),
  }));
  
  // Add text to entropy
  const entropyWithText = entropy.map(item => ({
    ...item,
    text: nodes.get(item.rule_id)?.text || String(item.rule_id),
  }));
  
  // Branch distribution with text
  const branchDistWithText: Record<string, Array<{child: number; count: number; text: string}>> = {};
  branches.forEach((nextMap, ruleId) => {
    const entries = Array.from(nextMap.entries())
      .map(([childId, count]) => ({
        child: childId,
        count,
        text: nodes.get(childId)?.text || String(childId),
      }))
      .sort((a, b) => b.count - a.count);
    branchDistWithText[ruleId] = entries.slice(0, 10); // top 10
  });
  
  return {
    lengths_summary: lengthsSummary,
    top_intents_top10: intentsWithText.slice(0, 10),
    leaf_frequency_top20: leaves.slice(0, 20),
    branch_distribution: branchDistWithText,
    weekday_trends: weekdays,
    node_funnel: funnel,
    entropy_complexity_top20: entropyWithText.slice(0, 20),
    top_paths_top20: paths20,
    dead_ends_top20: deadEndsData.slice(0, 20),
    url_engagement_top20: urlEngagementData.slice(0, 20),
    depth_funnel: depthFunnelData,
    anomalies_top20: anomaliesData.slice(0, 20),
    duplicates_by_text: duplicatesData,
    unreachable_nodes: unreachableData,
    coverage_ratio: coverageData,
  };
}

