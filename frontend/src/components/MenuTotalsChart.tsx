// src/components/MenuTotalsChart.tsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { fetchMenuTotals, type MenuTotal } from "../api/analytics";

export default function MenuTotalsChart({
  days = 30,
  limit = 50,
  onPickMenu,
}: {
  days?: number;
  limit?: number;
  onPickMenu?: (m: MenuTotal) => void;
}) {
  const [data, setData] = useState<MenuTotal[]>([]);

  useEffect(() => {
    fetchMenuTotals(days, limit).then(setData).catch(() => setData([]));
  }, [days, limit]);

  return (
    <div className="w-full">
      <div className="text-sm opacity-70 mb-2">直近{days}日のメニュー別 合計</div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 48, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          {/* 青系に統一 */}
          <defs>
            <linearGradient id="ordersBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="salesBlueTotals" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          <Bar
            yAxisId="left"
            dataKey="orders"
            name="注文件数"
            fill="url(#ordersBlue)"
            onClick={(_, idx) => onPickMenu?.(data[idx])}
          />
          <Bar
            yAxisId="right"
            dataKey="sales"
            name="売上金額"
            fill="url(#salesBlueTotals)"
            onClick={(_, idx) => onPickMenu?.(data[idx])}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}