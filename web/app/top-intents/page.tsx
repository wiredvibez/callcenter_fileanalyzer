'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import TopIntentsChart from "./top-intents-chart";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      setData(analytics.top_intents_top10 || []);
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
      <h1 className="text-2xl font-semibold">Top Intents</h1>
      <Card>
        <CardHeader>
          <CardTitle>Most frequent intents</CardTitle>
        </CardHeader>
        <CardContent>
          <TopIntentsChart data={data.slice(0, 50)} />
        </CardContent>
      </Card>
      <div className="text-sm text-muted-foreground">Showing top {Math.min(data.length, 50)} by frequency.</div>
    </div>
  );
}


