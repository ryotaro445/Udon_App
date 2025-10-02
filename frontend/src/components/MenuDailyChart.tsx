import React, { useEffect, useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
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
          <Bar  yAxisId="right" dataKey="sales"  name="売上金額" />
          <Line yAxisId="left"  dataKey="orders" name="注文件数" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}