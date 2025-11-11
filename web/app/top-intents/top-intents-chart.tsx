"use client";

import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export default function TopIntentsChart({ data }: { data: any[] }) {
  const chart = data.map((d) => ({
    id: d.rule_id,
    text: d.text,
    count: d.count
  }));
  return (
    <div className="h-[520px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="text" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}


