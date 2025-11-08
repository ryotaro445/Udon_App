// frontend/src/components/HeatmapGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { fetchHeatmap } from "@/lib/api";
import type { HeatmapCell } from "@/lib/types";

type Props = {
  menuId: number | "all";
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
};

const DOW_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function HeatmapGrid({ menuId, start, end }: Props) {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rows = await fetchHeatmap({ menu_id: menuId, start, end });
        if (!active) return;
        setCells(rows);
      } catch (e: any) {
        setErr(e?.message ?? "error");
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false };
  }, [menuId, start, end]);

  // 0..6 x 0..23 にマップ
  const matrix = useMemo(() => {
    const m = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const c of cells) {
      m[c.dow][c.hour] = c.y;
      if (c.y > max) max = c.y;
    }
    return { m, max };
  }, [cells]);

  if (loading) return <div className="text-sm text-gray-500">Loading heatmap...</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;

  return (
    <div className="w-full">
      <h3 className="font-semibold mb-2">ヒートマップ（{start}〜{end}）</h3>
      <div className="overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `80px repeat(24, minmax(20px, 1fr))` }}>
          {/* ヘッダー行 */}
          <div></div>
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-[10px] text-gray-500 text-center px-1 py-0.5">{h}</div>
          ))}
          {/* 本体 */}
          {matrix.m.map((row, d) => (
            <>
              <div key={`label-${d}`} className="text-xs font-medium text-gray-600 px-2 py-1 sticky left-0 bg-white">
                {DOW_LABELS[d]}
              </div>
              {row.map((val, h) => {
                const intensity = matrix.max ? val / matrix.max : 0;
                // 0..1 -> 透明度/明度で擬似的に濃淡
                const bg = `rgba(30,144,255, ${0.15 + 0.7*intensity})`;
                return (
                  <div
                    key={`${d}-${h}`}
                    className="border border-gray-100 text-[10px] text-center"
                    style={{ background: bg, padding: "6px" }}
                    title={`dow=${d} hour=${h} y=${val}`}
                  >
                    {val > 0 ? Math.round(val) : ""}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">色は数量に比例します（セルにホバーで値）。</p>
    </div>
  );
}