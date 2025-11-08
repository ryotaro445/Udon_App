// frontend/src/components/LineChartForecast.tsx
import { useEffect, useMemo, useState } from "react";
import { fetchForecast } from "@/lib/api";
import type { ForecastPoint } from "@/lib/types";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Area,
  CartesianGrid,
} from "recharts";

type Props = {
  menuId: number | "all";
  days?: number; // default 7
};

export default function LineChartForecast({ menuId, days = 7 }: Props) {
  const [data, setData] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rows = await fetchForecast({ menu_id: menuId, days });
        if (!active) return;
        // 単一メニュー選択時に限定
        const filtered = menuId === "all" ? rows : rows.filter(r => r.menu_id === Number(menuId));
        setData(filtered);
      } catch (e: any) {
        setErr(e?.message ?? "error");
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false };
  }, [menuId, days]);

  const chartData = useMemo(
    () =>
      data.map(r => ({
        ds: r.ds,
        forecast: r.yhat,
        lo: r.yhat_lo,
        hi: r.yhat_hi,
      })),
    [data]
  );

  if (loading) return <div className="text-sm text-gray-500">Loading forecast...</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (chartData.length === 0) return <div className="text-sm text-gray-400">No forecast.</div>;

  return (
    <div className="w-full h-80 rounded-2xl border p-4">
      <h3 className="font-semibold mb-2">7日予測</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ds" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* 予測の信頼区間をシェーディング */}
          <Area dataKey="hi" name="上限" type="monotone" dot={false} opacity={0.15} />
          <Area dataKey="lo" name="下限" type="monotone" dot={false} opacity={0.15} />
          {/* 予測ライン（破線） */}
          <Line dataKey="forecast" name="予測" type="monotone" strokeDasharray="6 4" dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">
        実績線は省略（API要件が予測のみのため）。必要なら実績 API を追加して重ね描画できます。
      </p>
    </div>
  );
}