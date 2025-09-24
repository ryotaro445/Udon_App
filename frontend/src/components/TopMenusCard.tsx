import { useEffect, useState } from "react";
import { fetchTopMenus, type TopMenu } from "../api/analytics";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function TopMenusCard({ days = 30, limit = 5 }: { days?: number; limit?: number }) {
  const [rows, setRows] = useState<TopMenu[]>([]);
  useEffect(() => { fetchTopMenus(limit, days).then(setRows); }, [days, limit]);

  return (
    <div className="rounded-2xl shadow p-4 bg-white">
      <div className="font-semibold mb-2">人気メニュー（数量）</div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantity" name="数量" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}