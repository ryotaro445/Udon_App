import React, { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
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
  useEffect(() => { fetchMenuTotals(days, limit).then(setData).catch(() => setData([])); }, [days, limit]);

  return (
    <div>
      <div className="text-sm opacity-70 mb-2">直近{days}日のメニュー別 合計</div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} margin={{ top: 10, right: 16, bottom: 56, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left"  dataKey="orders" name="注文件数" onClick={(_, i) => onPickMenu?.(data[i])} />
          <Bar yAxisId="right" dataKey="sales"  name="売上金額" onClick={(_, i) => onPickMenu?.(data[i])} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}