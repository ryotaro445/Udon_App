// frontend/src/components/analytics/ForecastLine.tsx
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
} from "recharts";
import type { ForecastPoint, ActualPoint } from "../../types/analytics";

type Props = {
  title?: string;
  forecast: ForecastPoint[];   // 7日先など未来を含む配列
  actual?: ActualPoint[];      // 過去実績（任意）
  dateFormat?: (ds: string) => string;
};

/**
 * 実績（実線）＋予測（破線）＋予測区間（薄いオレンジ帯）をまとめて表示。
 * forecast / actual は別配列で渡してOK。
 */
export default function ForecastLine({
  title = "Forecast",
  forecast,
  actual = [],
  dateFormat,
}: Props) {
  // ds（日付）で結合しつつ、帯用の band を追加:
  // { ds, actual?, yhat, yhat_lo, yhat_hi, band }
  const data = useMemo(() => {
    const byDs = new Map<string, any>();

    for (const f of forecast) {
      const band = (f.yhat_hi ?? 0) - (f.yhat_lo ?? 0);
      byDs.set(f.ds, {
        ds: f.ds,
        yhat: f.yhat,
        yhat_lo: f.yhat_lo,
        yhat_hi: f.yhat_hi,
        band,
      });
    }

    for (const a of actual) {
      const row = byDs.get(a.ds) ?? { ds: a.ds };
      row.actual = a.y;
      byDs.set(a.ds, row);
    }

    // 日付順にソート
    return Array.from(byDs.values()).sort((a, b) => a.ds.localeCompare(b.ds));
  }, [forecast, actual]);

  const formatX = (iso: string) => (dateFormat ? dateFormat(iso) : iso);

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-lg font-semibold">{title}</div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ds"
              tickFormatter={formatX}
              minTickGap={24}
              style={{ fontSize: 12 }}
            />
            <YAxis width={56} style={{ fontSize: 12 }} />

            {/* カスタムツールチップ：上限／下限／需要予測値 */}
            <Tooltip
              content={({ label, payload }) => {
                if (!payload || payload.length === 0) return null;
                const p = payload[0].payload as any;
                return (
                  <div className="rounded-md border bg-white px-3 py-2 text-xs shadow">
                    <div className="font-semibold mb-1">
                      日付: {formatX(String(label))}
                    </div>
                    <div>上限：{p.yhat_hi?.toLocaleString?.() ?? p.yhat_hi}</div>
                    <div>下限：{p.yhat_lo?.toLocaleString?.() ?? p.yhat_lo}</div>
                    <div>需要予測値：{p.yhat?.toLocaleString?.() ?? p.yhat}</div>
                  </div>
                );
              }}
            />

            <Legend />

            {/* オレンジの帯（上限〜下限の範囲） */}
            {/* yhat_lo を下側のベース、band(= 上限-下限) を積み上げて帯にする */}
            <Area
              type="monotone"
              dataKey="yhat_lo"
              stackId="range"
              stroke="none"
              fillOpacity={0}
              activeDot={false as any}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="band"
              stackId="range"
              stroke="none"
              fill="orange"
              fillOpacity={0.25}
              name="上限〜下限の範囲"
              activeDot={false as any}
              isAnimationActive={false}
            />

            {/* 需要予測値の折れ線（帯の中を走る） */}
            <Line
              type="monotone"
              dataKey="yhat"
              name="需要予測値"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />

            {/* 実績線（実線） */}
            {data.some((d) => d.actual != null) && (
              <Line
                type="monotone"
                dataKey="actual"
                name="実績"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        実績線は actual を渡したときのみ表示されます（未指定なら予測のみ）。
      </p>
    </div>
  );
}