'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [ruleTextMap, setRuleTextMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      const data = analytics.node_funnel || {};
      const rowsData = Object.entries(data).map(([rid, v]: [string, any]) => ({ 
        rule_id: Number(rid), 
        ...v 
      }));
      rowsData.sort((a, b) => b.drop_off - a.drop_off);
      setRows(rowsData);
      
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
      <h1 className="text-2xl font-semibold">Node Funnel</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Reach</th>
              <th className="py-2 pr-4">Transitions</th>
              <th className="py-2 pr-4">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{ruleTextMap.get(r.rule_id) ?? String(r.rule_id)}</td>
                <td className="py-2 pr-4">{r.reach}</td>
                <td className="py-2 pr-4">{r.transitions}</td>
                <td className="py-2 pr-4">{r.drop_off}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
