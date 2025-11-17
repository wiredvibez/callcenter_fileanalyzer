'use client';

import { useEffect, useState } from "react";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [entries, setEntries] = useState<Array<[string, number[]]>>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      // Duplicates not generated yet - empty for now
      setEntries([]);
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
      <h1 className="text-2xl font-semibold">Duplicates by Text</h1>
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No duplicates found
        </div>
      ) : (
        <ul className="space-y-4">
          {entries.map(([text, ids]) => (
            <li key={text} className="rounded-md border p-4">
              <div className="mb-2 text-sm font-semibold">Duplicates ({ids.length})</div>
              <div className="text-sm break-words text-muted-foreground mb-2">{text}</div>
              <div className="text-xs break-words">
                {ids.map((id) => String(id)).join(" | ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
