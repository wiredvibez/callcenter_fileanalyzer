'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [rows, setRows] = useState<{ depth: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      // depth_funnel is not in the main analytics, return empty for now
      // This page may need backend analytics generation update
      setRows([]);
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
      <h1 className="text-2xl font-semibold">Depth Funnel</h1>
      {rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No depth funnel data available yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4">Depth</th>
                <th className="py-2 pr-4">Calls reaching</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.depth} className="border-t">
                  <td className="py-2 pr-4">{r.depth}</td>
                  <td className="py-2 pr-4">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
