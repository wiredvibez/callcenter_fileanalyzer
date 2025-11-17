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
      // Unreachable nodes not generated yet - empty for now
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
      <h1 className="text-2xl font-semibold">Unreachable Nodes</h1>
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No unreachable nodes found
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((n) => (
            <li key={n.rule_id} className="rounded border p-2">
              <span className="font-semibold">{n.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
