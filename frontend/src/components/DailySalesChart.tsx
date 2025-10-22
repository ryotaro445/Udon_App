// frontend/src/components/DailySalesChart.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import type { DailyPoint } from "../api/analytics";

export default function DailySalesChart({
  data,
  height = 320,
}: {
  data: DailyPoint[];
  height?: number;
}) {
  const chartData = useMemo(() => (data ?? []).map(d => ({ date: d.date, sales: d.sales, orders: d.orders ?? 0 })), [data]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) =>
              new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(Number(v))
            }
          />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="sales" dot />
          
          <Line yAxisId="right" type="monotone" dataKey="orders" strokeDasharray="4 2" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}