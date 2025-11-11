import csv
import json
import argparse
import os
import re
import datetime as dt
from collections import defaultdict, OrderedDict
from typing import Dict, List, Optional, Tuple, Set, Any


def coerce_null(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    s = value.strip()
    if s == "" or s.upper() == "NULL":
        return None
    return s


def build_tree(nodes_by_id: Dict[int, Dict[str, Any]], children_map: Dict[int, Set[int]]) -> List[Dict[str, Any]]:
    """
    Build a hierarchical tree (or forest) from nodes and parent->children mapping.
    Roots are nodes whose parent_id == 0 (as seen in the dataset).
    """
    roots = [n for n in nodes_by_id.values() if n["parent_id"] == 0]

    def expand(node: Dict[str, Any]) -> Dict[str, Any]:
        node_id = node["rule_id"]
        children: List[Dict[str, Any]] = []
        # Sort children by text (Hebrew-safe) then by rule_id for determinism
        for child_id in sorted(children_map.get(node_id, []), key=lambda rid: (nodes_by_id[rid]["text"], rid)):
            child_node = nodes_by_id[child_id]
            children.append(expand(child_node))
        return {
            "rule_id": node["rule_id"],
            "text": node["text"],
            "url": node["url"],
            "children": children,
        }

    roots_sorted = sorted(roots, key=lambda n: (n["text"], n["rule_id"]))
    return [expand(r) for r in roots_sorted]


def main() -> None:
    parser = argparse.ArgumentParser(description="Build button tree and per-call paths from call center CSV")
    parser.add_argument(
        "input_csv",
        nargs="?",
        help="Path to CSV (columns: call_id,call_date,rule_id,rule_parent_id,rule_text,popUpURL). When omitted with --all, scans --data-dir.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all CSV files found in --data-dir (default: ./data)",
    )
    parser.add_argument(
        "--data-dir",
        default=None,
        help="Directory containing CSV files (used with --all). Default: ./data next to this script",
    )
    parser.add_argument(
        "--tree-out",
        default=None,
        help="Output JSON for the global button tree. Default: <csv_name>.button_tree.json (in ./json)",
    )
    parser.add_argument(
        "--paths-out",
        default=None,
        help="Output JSON for per-call paths. Default: <csv_name>.call_paths.json (in ./json)",
    )
    args = parser.parse_args()

    # Paths setup
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_dir = os.path.join(script_dir, "json")
    os.makedirs(json_dir, exist_ok=True)

    def process_single_csv(input_csv: str, tree_out: Optional[str] = None, paths_out: Optional[str] = None) -> None:
        csv_basename = os.path.basename(input_csv)
        csv_stem = os.path.splitext(csv_basename)[0]
        safe_stem = re.sub(r"[^A-Za-z0-9_.-]+", "_", csv_stem).strip("_")
        tree_out_path = tree_out or os.path.join(json_dir, f"{safe_stem}.button_tree.json")
        paths_out_path = paths_out or os.path.join(json_dir, f"{safe_stem}.call_paths.json")

    # Core structures
        nodes_by_id: Dict[int, Dict[str, Any]] = {}       # rule_id -> node
        parent_of: Dict[int, int] = {}                    # rule_id -> parent_id (first-seen)
        children_map: Dict[int, Set[int]] = defaultdict(set)  # parent_id -> set(child_id)
        call_events: Dict[str, List[Tuple[int, int]]] = defaultdict(list)  # call_id -> [(seq, rule_id)]
        call_meta: Dict[str, Dict[str, Any]] = {}  # call_id -> {call_date, weekday}

    # Optional data quality flags
        inconsistent_parent_ids: List[Tuple[int, int, int]] = []  # (rule_id, first_parent, seen_parent)

        def parse_date_maybe(s: Optional[str]) -> Optional[dt.date]:
            if not s:
                return None
            s = s.strip()
            # Try common formats (MM/DD/YYYY, DD/MM/YYYY, ISO, etc.)
            for fmt in ("%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y"):
                try:
                    return dt.datetime.strptime(s, fmt).date()
                except Exception:
                    continue
            return None

    # Read CSV (utf-8-sig handles BOM if present)
        with open(input_csv, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            seq = 0
            for row in reader:
                seq += 1
                call_id = (row.get("call_id") or "").strip()
                call_date_raw = (row.get("call_date") or "").strip()
                if call_id and call_id not in call_meta:
                    parsed = parse_date_maybe(call_date_raw)
                    weekday = parsed.isoweekday() if parsed else None  # 1=Mon .. 7=Sun
                    call_meta[call_id] = {"call_date": call_date_raw or None, "weekday": weekday}
                # Parse IDs
                try:
                    rule_id = int((row.get("rule_id") or "").strip())
                except Exception:
                    # Skip malformed
                    continue
                try:
                    parent_id = int((row.get("rule_parent_id") or "").strip())
                except Exception:
                    parent_id = 0

                text = coerce_null(row.get("rule_text"))
                url = coerce_null(row.get("popUpURL"))

                # Register node (prefer first-seen attributes if repeated)
                if rule_id not in nodes_by_id:
                    nodes_by_id[rule_id] = {
                        "rule_id": rule_id,
                        "parent_id": parent_id,
                        "text": text or "",
                        "url": url,
                    }
                    parent_of[rule_id] = parent_id
                else:
                    if parent_of[rule_id] != parent_id:
                        inconsistent_parent_ids.append((rule_id, parent_of[rule_id], parent_id))
                    # Keep first seen parent/text/url for stability

                # Build structure link
                children_map[parent_id].add(rule_id)

                # Preserve file order per call
                call_events[call_id].append((seq, rule_id))

        # Build the hierarchical tree
        tree = build_tree(nodes_by_id, children_map)

        # Build per-call readable paths
        call_paths: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
        # Sort call_ids numerically when possible for readability
        def call_sort_key(x: str) -> Tuple[int, str]:
            try:
                return (0, int(x))
            except Exception:
                return (1, x)

        for cid in sorted(call_events, key=call_sort_key):
            ordered = sorted(call_events[cid], key=lambda t: t[0])  # by sequence
            path: List[Dict[str, Any]] = []
            for _, rid in ordered:
                n = nodes_by_id.get(rid)
                if n is None:
                    continue
                path.append({"rule_id": rid, "text": n["text"], "url": n["url"]})
            meta = call_meta.get(cid, {})
            call_paths[cid] = {
                "call_id": cid,
                "call_date": meta.get("call_date"),
                "weekday": meta.get("weekday"),
                "path": path,
            }

        # Write outputs
        with open(tree_out_path, "w", encoding="utf-8") as fo:
            json.dump(tree, fo, ensure_ascii=False, indent=2)
        with open(paths_out_path, "w", encoding="utf-8") as fo:
            json.dump(call_paths, fo, ensure_ascii=False, indent=2)

        # Final report to stdout
        roots_count = len(tree)
        nodes_count = len(nodes_by_id)
        calls_count = len(call_paths)
        print(f"Wrote {tree_out_path} (roots: {roots_count}), nodes: {nodes_count}")
        print(f"Wrote {paths_out_path} (calls: {calls_count})")
        if inconsistent_parent_ids:
            print(f"Warning: {len(inconsistent_parent_ids)} rule_id(s) with inconsistent parent_id encountered (kept first seen).")

    # Dispatch: single file or scan data dir
    if args.all:
        data_dir = args.data_dir or os.path.join(script_dir, "data")
        if not os.path.isdir(data_dir):
            raise SystemExit(f"Data directory not found: {data_dir}")
        # Process all CSV files
        for name in sorted(os.listdir(data_dir)):
            if not name.lower().endswith(".csv"):
                continue
            process_single_csv(os.path.join(data_dir, name), tree_out=None, paths_out=None)
        # Aggregate once at the end
        try:
            import aggregate_runs
            aggregate_runs.aggregate_runs(source_dir=json_dir, output_dir=script_dir)
        except Exception as e:
            print(f"Aggregation warning: {e}")
    else:
        if not args.input_csv:
            raise SystemExit("Please provide an input CSV path or use --all to scan the data directory.")
        process_single_csv(args.input_csv, tree_out=args.tree_out, paths_out=args.paths_out)
        # Aggregate after single run
        try:
            import aggregate_runs
            aggregate_runs.aggregate_runs(source_dir=json_dir, output_dir=script_dir)
        except Exception as e:
            print(f"Aggregation warning: {e}")


if __name__ == "__main__":
    main()


