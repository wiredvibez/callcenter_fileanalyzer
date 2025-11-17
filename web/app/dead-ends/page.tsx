'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      setItems(analytics.dead_ends_top20 || []);
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
      <h1 className="text-2xl font-semibold">Dead Ends</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Has Children</th>
              <th className="py-2 pr-4">Termination Rate</th>
              <th className="py-2 pr-4">Reach</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{d.text ?? String(d.rule_id)}</td>
                <td className="py-2 pr-4">{d.has_children ? "Yes" : "No"}</td>
                <td className="py-2 pr-4">{(d.termination_rate * 100).toFixed(1)}%</td>
                <td className="py-2 pr-4">{d.reach_occurrences}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

