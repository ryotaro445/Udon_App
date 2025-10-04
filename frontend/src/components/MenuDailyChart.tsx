// src/components/MenuDailyChart.tsx
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
import { fetchMenuDaily, type MenuDailyPoint, type MenuTotal } from "../api/analytics";

export default function MenuDailyChart({ picked, days = 14 }: { picked: MenuTotal | null; days?: number; }) {
  const [data, setData] = useState<MenuDailyPoint[]>([]);
  useEffect(() => { if (picked) fetchMenuDaily(picked.menu_id, days).then(setData).catch(() => setData([])); }, [picked, days]);
  if (!picked) return <div className="opacity-70 text-sm">メニューをクリックすると日別推移を表示します。</div>;

  return (
    <div className="mt-6">
      <div className="text-sm opacity-70 mb-2">「{picked.name}」の直近{days}日 推移</div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          {/* 青系に統一 */}
          <defs>
            <linearGradient id="salesBlueDaily" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <Bar  yAxisId="right" dataKey="sales"  name="売上金額" fill="url(#salesBlueDaily)" />
          <Line yAxisId="left"  dataKey="orders" name="注文件数" stroke="#0369a1" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}