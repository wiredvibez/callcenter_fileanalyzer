'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [items, setItems] = useState<Array<[string, number]>>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      // URL engagement not generated yet - empty for now
      setItems([]);
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
      <h1 className="text-2xl font-semibold">URL Engagement</h1>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No URL engagement data available yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4">URL</th>
                <th className="py-2 pr-4">Count</th>
              </tr>
            </thead>
            <tbody>
              {items.map(([url, count], idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 pr-4 break-all">{url}</td>
                  <td className="py-2 pr-4">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
