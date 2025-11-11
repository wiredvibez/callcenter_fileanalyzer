"use client";

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function SummaryCharts({ intents, weekday }: { intents: any[]; weekday: Record<string, number> }) {
  const intentsData = (intents || []).map((i) => ({
    name: i.text ?? String(i.rule_id),
    count: i.count
  }));
  // Map ISO weekday (1=Mon..7=Sun) to Hebrew names and order with Sunday first
  const hebrewNames: Record<number, string> = {
    7: "ראשון",
    1: "שני",
    2: "שלישי",
    3: "רביעי",
    4: "חמישי",
    5: "שישי",
    6: "שבת"
  };
  const order: number[] = [7, 1, 2, 3, 4, 5, 6];
  const weekdayData = order.map((d) => ({
    weekday: hebrewNames[d],
    calls: Number((weekday || {})[String(d)] ?? 0)
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top Intents</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={intentsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekday Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekday" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}


