"use client";

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export default function WeekdayChart({ data }: { data: Record<string, number> }) {
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
  const chart = order.map((d) => ({
    weekday: hebrewNames[d],
    calls: Number((data || {})[String(d)] ?? 0)
  }));
  return (
    <div className="h-[480px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="weekday" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="calls" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


