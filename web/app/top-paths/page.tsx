'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [ruleTextMap, setRuleTextMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      setItems(analytics.top_paths_top20 || []);
      
      // Build rule text map from button tree
      const map = new Map<number, string>();
      const buildMap = (nodes: any[]) => {
        if (!nodes) return;
        for (const node of nodes) {
          if (node.rule_id) {
            map.set(node.rule_id, node.text || String(node.rule_id));
          }
          if (node.children) {
            buildMap(node.children);
          }
        }
      };
      buildMap(analytics.button_tree || []);
      setRuleTextMap(map);
      setHasData(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">טוען...</div>;
  }

  if (!hasData) {
    return <NoDataMessage />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Top Paths</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Count</th>
              <th className="py-2 pr-4">Path (text sequence)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="py-2 pr-4">{row.count}</td>
                <td className="py-2 pr-4 break-words">
                  {(row.path || [])
                    .map((id: number | string) => ruleTextMap.get(Number(id)) ?? String(id))
                    .join(" → ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

