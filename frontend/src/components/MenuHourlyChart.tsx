// src/components/MenuHourlyChart.tsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { fetchMenuHourly, type MenuHourlyBucket, type MenuTotal } from "../api/analytics";

type Point = { hour: number; orders: number; amount: number };

export default function MenuHourlyChart({ picked, days = 7 }: { picked: MenuTotal | null; days?: number; }) {
  const [data, setData] = useState<Point[]>([]);
  useEffect(() => {
    if (!picked) { setData([]); return; }
    fetchMenuHourly(picked.menu_id, days).then((o) => setData(o.buckets)).catch(() => setData([]));
  }, [picked, days]);

  if (!picked) return <div className="opacity-70 text-sm">メニューをクリックすると時間別推移を表示します。</div>;

  const hourLabel = (h: number) => `${h.toString().padStart(2, "0")}:00`;

  return (
    <div className="mt-6">
      <div className="text-sm opacity-70 mb-2">「{picked.name}」の直近{days}日 時間別</div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" tickFormatter={hourLabel} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip labelFormatter={(v) => hourLabel(Number(v))} />
          <Legend />
          {/* 青系に統一 */}
          <defs>
            <linearGradient id="salesBlueHourly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <Bar  yAxisId="right" dataKey="amount" name="売上金額" fill="url(#salesBlueHourly)" />
          <Line yAxisId="left"  dataKey="orders" name="注文件数" stroke="#0369a1" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}