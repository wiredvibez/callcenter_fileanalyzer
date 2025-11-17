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
      setItems(analytics.leaf_frequency_top20 || []);
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
      <h1 className="text-2xl font-semibold">Leaf Frequency</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 pr-4">Text</th>
              <th className="py-2 pr-4">Count</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.rule_id} className="border-t">
                <td className="py-2 pr-4 break-words">{i.text}</td>
                <td className="py-2 pr-4">{i.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
