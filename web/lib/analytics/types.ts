// Core types for analytics processing

export interface TreeNode {
  rule_id: number;
  parent_id: number;
  text: string;
  url: string | null;
  children?: TreeNode[];
}

export interface CallPath {
  source_call: string;
  call_id: string;
  call_date: string | null;
  weekday: number | null;
  path: Array<{
    rule_id: number;
    text: string;
    url: string | null;
  }>;
}

export interface CallPaths {
  [key: string]: CallPath;
}

export interface NodeData {
  rule_id: number;
  parent_id: number;
  text: string;
  url: string | null;
}

export interface ProcessedData {
  button_tree: TreeNode[];
  call_paths: CallPaths;
}

export interface AnalyticsResult {
  lengths_summary: {
    count: number;
    avg: number;
    median: number;
    p90: number;
    p95: number;
    min: number;
    max: number;
  };
  weekday_trends: Record<string, number>;
  top_intents_top10: Array<{
    rule_id: number;
    count: number;
    text: string;
  }>;
  dead_ends_top20: Array<{
    rule_id: number;
    reach_occurrences: number;
    terminations: number;
    termination_rate: number;
    has_children: boolean;
  }>;
  entropy_complexity_top20: Array<{
    rule_id: number;
    entropy_bits: number;
    perplexity: number;
    branching_factor: number;
    text: string;
  }>;
}

