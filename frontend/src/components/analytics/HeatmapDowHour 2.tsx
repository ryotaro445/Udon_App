import { useMemo } from "react";
import type { HeatmapCell } from "@/types/analytics";

type Props = {
  title?: string;
  data: HeatmapCell[];            // [{dow, hour, y}]
  firstDayOfWeek?: 0 | 1;         // 0=Sun開始, 1=Mon開始（デフォ: Mon）
  maxValueHint?: number;          // スケールの上限ヒント（省略時は自動）
};

const DOW_LABELS_JA = ["日", "月", "火", "水", "木", "金", "土"];

export default function HeatmapDowHour({
  title = "Heatmap (曜日×時間)",
  data,
  firstDayOfWeek = 1,
  maxValueHint,
}: Props) {
  // 7 x 24 に正規化
  const grid = useMemo(() => {
    const mat: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const c of data) {
      const r = ((c.dow - firstDayOfWeek + 7) % 7); // 並び替え
      if (r >= 0 && r < 7 && c.hour >= 0 && c.hour < 24) {
        mat[r][c.hour] = c.y ?? 0;
      }
    }
    return mat;
  }, [data, firstDayOfWeek]);

  const maxVal = useMemo(() => {
    if (maxValueHint && maxValueHint > 0) return maxValueHint;
    return grid.flat().reduce((m, v) => (v > m ? v : m), 0) || 1;
  }, [grid, maxValueHint]);

  // 0..max を 0..1 に正規化して HSL 明度で塗り分け（彩度固定）
  const colorFor = (v: number) => {
    const t = Math.min(1, Math.max(0, v / maxVal));
    const light = 95 - Math.round(t * 65); // 95%→30%
    return `hsl(210 70% ${light}%)`;        // 青系
  };

  const hourLabels = Array.from({ length: 24 }, (_, h) => `${h}`);

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-lg font-semibold">{title}</div>
      <div className="overflow-x-auto">
        {/* ヘッダ行（時間） */}
        <div className="grid"
             style={{ gridTemplateColumns: `64px repeat(24, minmax(28px, 1fr))` }}>
          <div />
          {hourLabels.map((h) => (
            <div key={h} className="px-1 py-1 text-center text-[10px] text-gray-500">{h}</div>
          ))}
        </div>

        {/* 本体 7行 */}
        <div className="grid gap-y-1"
             style={{ gridTemplateRows: `repeat(7, 1fr)` }}>
          {grid.map((row, r) => (
            <div key={r}
              className="grid items-center"
              style={{ gridTemplateColumns: `64px repeat(24, minmax(28px, 1fr))` }}>
              {/* 行ラベル（曜日） */}
              <div className="px-2 py-1 text-right text-xs text-gray-600">
                {DOW_LABELS_JA[(r + firstDayOfWeek) % 7]}
              </div>
              {/* 24セル */}
              {row.map((v, h) => (
                <div
                  key={`${r}-${h}`}
                  className="h-6 rounded"
                  style={{ background: colorFor(v) }}
                  title={`${DOW_LABELS_JA[(r + firstDayOfWeek) % 7]} ${h}時: ${v}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">少</span>
        <div className="h-3 w-40 rounded"
             style={{
               background: `linear-gradient(90deg, ${colorFor(0)} 0%, ${colorFor(maxVal)} 100%)`,
             }}
        />
        <span className="text-xs text-gray-500">多</span>
        <span className="ml-2 text-[10px] text-gray-400">max={maxVal}</span>
      </div>
    </div>
  );
}