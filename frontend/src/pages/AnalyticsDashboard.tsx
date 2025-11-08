import { useEffect, useMemo, useState } from "react";
import ForecastLine from "@/components/analytics/ForecastLine";
import HeatmapDowHour from "@/components/analytics/HeatmapDowHour";
import { fetchForecast, fetchHeatmap, fetchActualPlaceholder } from "@/lib/api/analytics";
import type { ActualPoint, ForecastPoint, HeatmapCell } from "@/types/analytics";

// ユーティリティ：日付表示を短縮
const fmt = (iso: string) => {
  // 例: 2025-10-31 → 10/31
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function AnalyticsDashboard() {
  const [menuId, setMenuId] = useState<number | "all">(1);
  const [days, setDays] = useState<number>(7);

  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [actual, setActual] = useState<ActualPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 期間（ヒートマップ用）
  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today);
    start.setDate(today.getDate() - 6); // 直近7日
    return { start: start.toISOString().slice(0, 10), end };
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [f, h] = await Promise.all([
          fetchForecast({ menuId, days }),
          fetchHeatmap({ menuId, start: range.start, end: range.end }),
        ]);
        setForecast(f);
        // 実績はプレースホルダ。実APIがある場合は lib/api を差し替え。
        const hist =
          menuId === "all"
            ? []
            : await fetchActualPlaceholder({ menuId, start: range.start, end: range.end });
        setActual(hist);
        setHeatmap(h);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [menuId, days, range.start, range.end]);

  const canShow = useMemo(() => forecast.length > 0, [forecast]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Menu ID</label>
          <input
            type="number"
            min={1}
            value={menuId === "all" ? 1 : menuId}
            onChange={(e) => setMenuId(Number(e.target.value) || 1)}
            className="w-28 rounded-xl border px-3 py-1 text-sm"
          />
          <button
            className="mt-1 text-xs text-blue-600 underline"
            onClick={() => setMenuId("all")}
          >
            全メニュー（all）
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Forecast Days</label>
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 7)))}
            className="w-28 rounded-xl border px-3 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500">期間（ヒートマップ）開始</label>
          <input
            type="date"
            value={range.start}
            onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
            className="rounded-xl border px-3 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">期間（ヒートマップ）終了</label>
          <input
            type="date"
            value={range.end}
            onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
            className="rounded-xl border px-3 py-1 text-sm"
          />
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">読み込み中…</div>}
      {err && <div className="text-sm text-red-600">エラー: {err}</div>}

      {canShow && (
        <ForecastLine
          title={`Menu ${menuId} — 実績＋予測`}
          forecast={forecast}
          actual={actual}
          dateFormat={fmt}
        />
      )}

      <HeatmapDowHour
        title={`Menu ${menuId} — 曜日×時間ヒートマップ`}
        data={heatmap}
        firstDayOfWeek={1}
      />
    </div>
  );
}