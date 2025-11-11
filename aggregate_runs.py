import json
import os
import glob
from collections import defaultdict
from typing import Dict, List, Any, Set, Tuple


def _flatten_tree(tree: List[Dict[str, Any]]) -> Tuple[Dict[int, Dict[str, Any]], Dict[int, int], Dict[int, Set[int]]]:
    """
    Flatten a tree (or forest) into:
      - nodes_by_id: rule_id -> {rule_id, text, url}
      - parent_of: rule_id -> parent_id (0 for roots)
      - children_map: parent_id -> set(child_ids)
    """
    nodes_by_id: Dict[int, Dict[str, Any]] = {}
    parent_of: Dict[int, int] = {}
    children_map: Dict[int, Set[int]] = defaultdict(set)

    def walk(node: Dict[str, Any], parent_id: int) -> None:
        rid = int(node["rule_id"])
        text = node.get("text") or ""
        url = node.get("url")
        if rid not in nodes_by_id:
            nodes_by_id[rid] = {"rule_id": rid, "text": text, "url": url}
            parent_of[rid] = parent_id
        # Prefer first-seen data; if seen again, keep existing
        children = node.get("children") or []
        if parent_id is not None:
            children_map[parent_id].add(rid)
        for child in children:
            walk(child, rid)

    # Roots have parent_id = 0
    for root in tree:
        walk(root, 0)

    return nodes_by_id, parent_of, children_map


def _build_tree(nodes_by_id: Dict[int, Dict[str, Any]], parent_of: Dict[int, int], children_map: Dict[int, Set[int]]) -> List[Dict[str, Any]]:
    roots = [rid for rid, pid in parent_of.items() if pid == 0]

    def expand(rid: int) -> Dict[str, Any]:
        node = nodes_by_id[rid]
        children = []
        # sort by text then id
        for child_id in sorted(children_map.get(rid, []), key=lambda x: (nodes_by_id[x]["text"], x)):
            children.append(expand(child_id))
        return {"rule_id": rid, "text": node["text"], "url": node.get("url"), "children": children}

    # Deterministic ordering
    roots_sorted = sorted(roots, key=lambda x: (nodes_by_id[x]["text"], x))
    return [expand(r) for r in roots_sorted]


def aggregate_runs(source_dir: str = "json", output_dir: str = ".") -> None:
    """
    Aggregate all per-run button_tree and call_paths JSONs found in source_dir into:
      - <output_dir>/button_tree.all.json (merged forest)
      - <output_dir>/call_paths.all.json (merged call paths; keys composed as <source>::<call_id>)
    """
    # Aggregate trees
    tree_paths = glob.glob(os.path.join(source_dir, "*.button_tree.json"))
    agg_nodes: Dict[int, Dict[str, Any]] = {}
    agg_parent_of: Dict[int, int] = {}
    agg_children_map: Dict[int, Set[int]] = defaultdict(set)

    for tp in tree_paths:
        try:
            with open(tp, "r", encoding="utf-8") as f:
                tree = json.load(f)
            nodes_by_id, parent_of, children_map = _flatten_tree(tree)
            # Merge nodes
            for rid, node in nodes_by_id.items():
                if rid not in agg_nodes:
                    agg_nodes[rid] = {"rule_id": rid, "text": node.get("text") or "", "url": node.get("url")}
                    agg_parent_of[rid] = parent_of.get(rid, 0)
                else:
                    # Keep first seen parent; fill missing text/url if any
                    if not agg_nodes[rid].get("text") and node.get("text"):
                        agg_nodes[rid]["text"] = node["text"]
                    if agg_nodes[rid].get("url") is None and node.get("url") is not None:
                        agg_nodes[rid]["url"] = node["url"]
                # Merge children links
            for pid, child_set in children_map.items():
                agg_children_map[pid].update(child_set)
        except Exception:
            # Skip malformed
            continue

    aggregated_tree = _build_tree(agg_nodes, agg_parent_of, agg_children_map) if agg_nodes else []

    # Aggregate call paths
    paths_paths = glob.glob(os.path.join(source_dir, "*.call_paths.json"))
    aggregated_paths: Dict[str, Any] = {}
    for pp in paths_paths:
        try:
            stem = os.path.basename(pp)
            if stem.endswith(".call_paths.json"):
                source = stem[: -len(".call_paths.json")]
            else:
                source = stem
            with open(pp, "r", encoding="utf-8") as f:
                paths = json.load(f)
            if isinstance(paths, dict):
                for call_id, entry in paths.items():
                    key = f"{source}::{call_id}"
                    # Support both legacy (list path) and enriched (object with metadata)
                    if isinstance(entry, list):
                        aggregated_paths[key] = {
                            "source": source,
                            "call_id": call_id,
                            "call_date": None,
                            "weekday": None,
                            "path": entry,
                        }
                    elif isinstance(entry, dict):
                        path_list = entry.get("path")
                        if isinstance(path_list, list):
                            aggregated_paths[key] = {
                                "source": source,
                                "call_id": entry.get("call_id", call_id),
                                "call_date": entry.get("call_date"),
                                "weekday": entry.get("weekday"),
                                "path": path_list,
                            }
                        else:
                            # Unexpected shape: try to coerce
                            aggregated_paths[key] = {
                                "source": source,
                                "call_id": entry.get("call_id", call_id),
                                "call_date": entry.get("call_date"),
                                "weekday": entry.get("weekday"),
                                "path": entry,  # as-is
                            }
        except Exception:
            continue

    # Write outputs
    tree_out = os.path.join(output_dir, "button_tree.all.json")
    with open(tree_out, "w", encoding="utf-8") as f:
        json.dump(aggregated_tree, f, ensure_ascii=False, indent=2)

    paths_out = os.path.join(output_dir, "call_paths.all.json")
    with open(paths_out, "w", encoding="utf-8") as f:
        json.dump(aggregated_paths, f, ensure_ascii=False, indent=2)

    print(f"Aggregated {len(tree_paths)} tree files -> {tree_out} (nodes: {len(agg_nodes)})")
    print(f"Aggregated {len(paths_paths)} path files -> {paths_out} (calls: {len(aggregated_paths)})")


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    aggregate_runs(source_dir=os.path.join(here, "json"), output_dir=here)


