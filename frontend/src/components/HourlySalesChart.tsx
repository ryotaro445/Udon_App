// src/components/HourlySalesChart.tsx
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { HourlyBucket } from "../api/analytics";

const hourLabel = (h: number): string => `${h.toString().padStart(2, "0")}:00`;
const jpy = (v: number): string =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(v);

export default function HourlySalesChart({
  buckets,
  height = 320,
}: {
  buckets: HourlyBucket[];
  height?: number;
}) {
  const chartData = useMemo(
    () =>
      (buckets ?? []).map((b) => ({
        hour: b.hour,
        label: hourLabel(b.hour),
        amount: b.amount,
        count: b.count,
      })),
    [buckets]
  );

  // ts(7006) 対策: 引数に型を付ける
  const tooltipFormatter = (value: number, name: string) =>
    name === "売上金額" ? jpy(value) : value;
  const labelFormatter = (label: string | number) => `${label} 台`;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 12, right: 24, bottom: 12, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" interval={0} angle={-20} dy={10} height={50} />
          <YAxis yAxisId="left" allowDecimals={false} />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v: number) => jpy(Number(v)).replace("¥", "")}
          />
          <Tooltip formatter={tooltipFormatter} labelFormatter={labelFormatter} />
          <Legend />
          {/* 売上金額: Bar（右軸）*/}
          <Bar yAxisId="right" dataKey="amount" name="売上金額" />
          {/* 注文件数: Line（左軸）*/}
          <Line yAxisId="left" type="monotone" dataKey="count" name="注文件数" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}