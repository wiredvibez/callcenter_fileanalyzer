'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import WeekdayChart from "./weekday-chart";
import { getAnalytics } from "../../lib/analytics-storage";
import NoDataMessage from "../../components/NoDataMessage";

export default function Page() {
  const [wd, setWd] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const analytics = getAnalytics();
    if (analytics) {
      setWd(analytics.weekday_trends || {});
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
      <h1 className="text-2xl font-semibold">Weekday Trends</h1>
      <Card>
        <CardHeader>
          <CardTitle>Calls by weekday (1=Mon .. 7=Sun)</CardTitle>
        </CardHeader>
        <CardContent>
          <WeekdayChart data={wd} />
        </CardContent>
      </Card>
    </div>
  );
}


