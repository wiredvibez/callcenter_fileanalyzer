import json
import os
import math
from collections import defaultdict, Counter
from typing import Dict, List, Any, Tuple, Optional


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def flatten_tree(tree: List[Dict[str, Any]]) -> Tuple[Dict[int, Dict[str, Any]], Dict[int, int], Dict[int, List[int]]]:
    nodes: Dict[int, Dict[str, Any]] = {}
    parent_of: Dict[int, int] = {}
    children: Dict[int, List[int]] = defaultdict(list)

    def walk(node: Dict[str, Any], parent: int) -> None:
        rid = int(node["rule_id"])
        if rid not in nodes:
            nodes[rid] = {"rule_id": rid, "text": node.get("text") or "", "url": node.get("url")}
            parent_of[rid] = parent
        # append child relationship once
        if parent is not None:
            if rid not in children[parent]:
                children[parent].append(rid)
        for child in node.get("children") or []:
            walk(child, rid)

    for root in tree:
        walk(root, 0)  # 0 marks root parent

    # deterministic child order
    for p, ch in children.items():
        children[p] = sorted(set(ch))
    return nodes, parent_of, children


def get_paths(call_paths_all: Dict[str, Any]) -> List[Dict[str, Any]]:
    paths: List[Dict[str, Any]] = []
    for key, entry in call_paths_all.items():
        # entry may be a dict with 'path' or legacy list
        if isinstance(entry, list):
            paths.append({"source_call": key, "call_id": key.split("::")[-1], "call_date": None, "weekday": None, "path": entry})
        elif isinstance(entry, dict):
            p = entry.get("path", [])
            paths.append({
                "source_call": key,
                "call_id": entry.get("call_id") or key.split("::")[-1],
                "call_date": entry.get("call_date"),
                "weekday": entry.get("weekday"),
                "path": p,
            })
    return paths


def path_rule_ids(path: List[Dict[str, Any]]) -> List[int]:
    return [int(step["rule_id"]) for step in path if "rule_id" in step]


def summarize_lengths(paths: List[Dict[str, Any]]) -> Dict[str, Any]:
    lengths = [len(p["path"]) for p in paths]
    if not lengths:
        return {}
    lengths_sorted = sorted(lengths)
    n = len(lengths_sorted)
    def pct(p: float) -> int:
        if n == 0:
            return 0
        idx = min(n - 1, max(0, int(math.ceil(p * n) - 1)))
        return lengths_sorted[idx]
    return {
        "count": n,
        "avg": sum(lengths_sorted) / n,
        "median": pct(0.5),
        "p90": pct(0.9),
        "p95": pct(0.95),
        "min": lengths_sorted[0],
        "max": lengths_sorted[-1],
    }


def top_intents(paths: List[Dict[str, Any]]) -> List[Tuple[int, int]]:
    # intent = first node after root (assumes root id=1 appears or path starts at first choice)
    counts: Counter = Counter()
    for p in paths:
        rids = path_rule_ids(p["path"])
        # find first non-root (if first is 1, take second)
        if not rids:
            continue
        intent = rids[1] if len(rids) > 1 and rids[0] == 1 else rids[0]
        counts[intent] += 1
    return counts.most_common()


def leaf_analysis(paths: List[Dict[str, Any]]) -> Counter:
    leaves: Counter = Counter()
    for p in paths:
        rids = path_rule_ids(p["path"])
        if rids:
            leaves[rids[-1]] += 1
    return leaves


def branch_distribution(paths: List[Dict[str, Any]]) -> Dict[int, Counter]:
    # For each node, distribution of next steps (by occurrences)
    dist: Dict[int, Counter] = defaultdict(Counter)
    for p in paths:
        rids = path_rule_ids(p["path"])
        for i in range(len(rids) - 1):
            dist[rids[i]][rids[i + 1]] += 1
    return dist


def weekday_trends(paths: List[Dict[str, Any]]) -> Dict[Optional[int], int]:
    by_wd: Dict[Optional[int], int] = defaultdict(int)
    for p in paths:
        by_wd[p.get("weekday")] += 1
    return dict(sorted(by_wd.items(), key=lambda x: (x[0] is None, x[0])))


def depth_funnel(paths: List[Dict[str, Any]]) -> Dict[int, int]:
    depth_counts: Counter = Counter()
    for p in paths:
        L = len(p["path"])
        for d in range(1, L + 1):
            depth_counts[d] += 1
    return dict(sorted(depth_counts.items()))


def node_funnel(paths: List[Dict[str, Any]]) -> Dict[int, Dict[str, int]]:
    # For each node: reach (occurrences), transitions (sum of next), drop_off = reach - transitions
    reach: Counter = Counter()
    transitions: Dict[int, Counter] = defaultdict(Counter)
    for p in paths:
        rids = path_rule_ids(p["path"])
        for i, rid in enumerate(rids):
            reach[rid] += 1
            if i < len(rids) - 1:
                transitions[rid][rids[i + 1]] += 1
    result: Dict[int, Dict[str, int]] = {}
    for rid, r in reach.items():
        trans_sum = sum(transitions.get(rid, {}).values())
        result[rid] = {
            "reach": r,
            "transitions": trans_sum,
            "drop_off": r - trans_sum,
        }
    return result


def dead_ends(paths: List[Dict[str, Any]], children: Dict[int, List[int]]) -> List[Dict[str, Any]]:
    # Termination rate for each node: last-occurrence / reach
    reach_occ: Counter = Counter()
    last_occ: Counter = Counter()
    for p in paths:
        rids = path_rule_ids(p["path"])
        for rid in rids:
            reach_occ[rid] += 1
        if rids:
            last_occ[rids[-1]] += 1
    out: List[Dict[str, Any]] = []
    for rid, r in reach_occ.items():
        last = last_occ.get(rid, 0)
        out.append({
            "rule_id": rid,
            "reach_occurrences": r,
            "terminations": last,
            "termination_rate": last / r if r else 0.0,
            "has_children": len(children.get(rid, [])) > 0
        })
    out.sort(key=lambda x: (-x["termination_rate"], -x["reach_occurrences"]))
    return out


def entropy_complexity(branch_dist: Dict[int, Counter]) -> Dict[int, Dict[str, float]]:
    out: Dict[int, Dict[str, float]] = {}
    for rid, ctr in branch_dist.items():
        total = sum(ctr.values())
        if total <= 0:
            out[rid] = {"entropy_bits": 0.0, "perplexity": 1.0, "branching_factor": 0.0}
            continue
        H = 0.0
        for _, c in ctr.items():
            p = c / total
            H -= p * math.log2(p) if p > 0 else 0.0
        out[rid] = {"entropy_bits": H, "perplexity": math.pow(2, H), "branching_factor": float(len(ctr))}
    return out


def url_engagement(paths: List[Dict[str, Any]]) -> Counter:
    ctr: Counter = Counter()
    for p in paths:
        for step in p["path"]:
            url = step.get("url")
            if url:
                ctr[url] += 1
    return ctr


def anomalies(paths: List[Dict[str, Any]], children: Dict[int, List[int]]) -> Counter:
    # Edges observed that are not tree edges
    bad_edges: Counter = Counter()
    tree_edges: set = set()
    for pid, ch in children.items():
        for c in ch:
            tree_edges.add((pid, c))
    for p in paths:
        rids = path_rule_ids(p["path"])
        for i in range(len(rids) - 1):
            edge = (rids[i], rids[i + 1])
            if edge not in tree_edges:
                bad_edges[edge] += 1
    return bad_edges


def duplicates_by_text(nodes: Dict[int, Dict[str, Any]]) -> Dict[str, List[int]]:
    buckets: Dict[str, List[int]] = defaultdict(list)
    for rid, node in nodes.items():
        txt = (node.get("text") or "").strip()
        buckets[txt].append(rid)
    # keep only duplicates
    return {t: rids for t, rids in buckets.items() if len(rids) > 1 and t}


def unreachable_nodes(nodes: Dict[int, Dict[str, Any]], reach_calls: Counter) -> List[int]:
    # Nodes that never appear in any call path
    return sorted([rid for rid in nodes if reach_calls.get(rid, 0) == 0])


def coverage_ratio(branch_dist: Dict[int, Counter]) -> Dict[int, Dict[str, float]]:
    out: Dict[int, Dict[str, float]] = {}
    for rid, ctr in branch_dist.items():
        total = sum(ctr.values())
        if total == 0:
            out[rid] = {"top1_coverage": 0.0, "top2_coverage": 0.0}
            continue
        top = [c for _, c in ctr.most_common(2)]
        top1 = top[0] if len(top) > 0 else 0
        top2 = top1 + (top[1] if len(top) > 1 else 0)
        out[rid] = {
            "top1_coverage": top1 / total,
            "top2_coverage": top2 / total
        }
    return out


def top_paths(paths: List[Dict[str, Any]], top_n: int = 50) -> List[Tuple[Tuple[int, ...], int]]:
    ctr: Counter = Counter()
    for p in paths:
        rids = tuple(path_rule_ids(p["path"]))
        if rids:
            ctr[rids] += 1
    return ctr.most_common(top_n)


def save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    analytics_dir = os.path.join(here, "analytics")
    os.makedirs(analytics_dir, exist_ok=True)

    tree = load_json(os.path.join(here, "button_tree.all.json"))
    call_paths_all = load_json(os.path.join(here, "call_paths.all.json"))

    nodes, parent_of, children = flatten_tree(tree)
    paths = get_paths(call_paths_all)

    # Precompute reach by occurrences for unreachable check
    reach_occ: Counter = Counter()
    for p in paths:
        for rid in path_rule_ids(p["path"]):
            reach_occ[rid] += 1

    # Metrics
    lengths_summary = summarize_lengths(paths)
    intents = top_intents(paths)
    leaves_ctr = leaf_analysis(paths)
    branch_dist = branch_distribution(paths)
    weekday_vol = weekday_trends(paths)
    depth_fn = depth_funnel(paths)
    node_fn = node_funnel(paths)
    dead_end_list = dead_ends(paths, children)
    entropy_map = entropy_complexity(branch_dist)
    url_ctr = url_engagement(paths)
    anomaly_edges = anomalies(paths, children)
    dup_text = duplicates_by_text(nodes)
    unreachable = unreachable_nodes(nodes, reach_occ)
    coverage = coverage_ratio(branch_dist)
    top_paths_list = top_paths(paths, top_n=100)

    # Outputs
    save_json(os.path.join(analytics_dir, "lengths_summary.json"), lengths_summary)
    save_json(os.path.join(analytics_dir, "top_intents.json"), [{"rule_id": rid, "count": c, "text": nodes.get(rid, {}).get("text", "")} for rid, c in intents])
    save_json(os.path.join(analytics_dir, "leaf_frequency.json"), [{"rule_id": rid, "count": c, "text": nodes.get(rid, {}).get("text", "")} for rid, c in leaves_ctr.most_common()])
    # Branch distribution: for size reasons, keep top 10 per node
    branch_out = {}
    for rid, ctr in branch_dist.items():
        branch_out[str(rid)] = [{"child": cid, "count": ctr[cid], "text": nodes.get(cid, {}).get("text", "")} for cid, _ in ctr.most_common(10)]
    save_json(os.path.join(analytics_dir, "branch_distribution.top10.json"), branch_out)
    save_json(os.path.join(analytics_dir, "weekday_trends.json"), weekday_vol)
    save_json(os.path.join(analytics_dir, "depth_funnel.json"), depth_fn)
    save_json(os.path.join(analytics_dir, "node_funnel.json"), node_fn)
    save_json(os.path.join(analytics_dir, "dead_ends.json"), dead_end_list[:200])
    save_json(os.path.join(analytics_dir, "entropy_complexity.json"), entropy_map)
    save_json(os.path.join(analytics_dir, "url_engagement.json"), url_ctr.most_common(200))
    save_json(os.path.join(analytics_dir, "anomalies.json"), [{"from": a, "to": b, "count": c} for (a, b), c in anomaly_edges.most_common(200)])
    save_json(os.path.join(analytics_dir, "duplicates_by_text.json"), dup_text)
    save_json(os.path.join(analytics_dir, "unreachable_nodes.json"), [{"rule_id": rid, "text": nodes.get(rid, {}).get("text", "")} for rid in unreachable])
    save_json(os.path.join(analytics_dir, "coverage_ratio.json"), coverage)
    save_json(os.path.join(analytics_dir, "top_paths.json"), [{"path": list(p), "count": c} for p, c in top_paths_list])

    # Summary file
    summary = {
        "lengths_summary": lengths_summary,
        "weekday_trends": weekday_vol,
        "top_intents_top10": [{"rule_id": rid, "count": c, "text": nodes.get(rid, {}).get("text", "")} for rid, c in intents[:10]],
        "dead_ends_top20": dead_end_list[:20],
        "entropy_complexity_top20": sorted(
            [{"rule_id": rid, **vals, "text": nodes.get(rid, {}).get("text", "")} for rid, vals in entropy_map.items()],
            key=lambda x: (-x["entropy_bits"], -branch_dist.get(x["rule_id"], Counter()).total() if hasattr(Counter, "total") else -sum(branch_dist.get(x["rule_id"], Counter()).values()))
        )[:20],
    }
    save_json(os.path.join(analytics_dir, "summary.json"), summary)
    print(f"Wrote analytics to: {analytics_dir}")


if __name__ == "__main__":
    main()





