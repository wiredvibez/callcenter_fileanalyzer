'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      setEdges(analytics.anomalies_top20 || []);
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
      <h1 className="text-2xl font-semibold">Anomalies (Edges not in tree)</h1>
      {edges.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No anomalies detected
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2 pr-4">From (ID)</th>
                <th className="py-2 pr-4">To (ID)</th>
                <th className="py-2 pr-4">Count</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((e, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 pr-4 break-words">
                    <div className="font-medium">{e.from_text}</div>
                    <div className="text-xs text-muted-foreground">ID: {e.from}</div>
                  </td>
                  <td className="py-2 pr-4 break-words">
                    <div className="font-medium">{e.to_text}</div>
                    <div className="text-xs text-muted-foreground">ID: {e.to}</div>
                  </td>
                  <td className="py-2 pr-4">{e.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
