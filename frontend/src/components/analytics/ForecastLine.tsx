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
import type { ForecastPoint, ActualPoint } from "@/types/analytics";

type Props = {
  title?: string;
  /** 7日先など未来を含む配列 */
  forecast: ForecastPoint[];
  /** 過去実績（任意） */
  actual?: ActualPoint[];
  /** X軸ラベルのフォーマット */
  dateFormat?: (ds: string) => string;
};

/**
 * 実績（実線）＋予測（破線）＋
 * 予測レンジ（上限〜下限の帯）をまとめて表示。
 */
export default function ForecastLine({
  title = "需要予測",
  forecast,
  actual = [],
  dateFormat,
}: Props) {
  // ds（日付）で結合：{ ds, actual?, yhat?, yhat_lo?, yhat_hi? }
  const data = useMemo(() => {
    const byDs = new Map<string, any>();

    for (const f of forecast) {
      byDs.set(f.ds, {
        ds: f.ds,
        yhat: f.yhat,
        yhat_lo: f.yhat_lo,
        yhat_hi: f.yhat_hi,
      });
    }
    for (const a of actual) {
      const row = byDs.get(a.ds) ?? { ds: a.ds };
      row.actual = a.y;
      byDs.set(a.ds, row);
    }

    // X軸が時間順になるようソート
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
            <Tooltip
              formatter={(v: any, name: string) => [
                v,
                name === "actual"
                  ? "実績"
                  : name === "yhat"
                  ? "予測"
                  : "需要レンジ",
              ]}
              labelFormatter={(l) => `日付: ${formatX(String(l))}`}
            />
            <Legend />

            {/* ▼ 需要レンジ（上限〜下限）の帯 */}
            {/* 上側：凡例に「需要レンジ（上限〜下限）」として表示 */}
            <Area
              type="monotone"
              dataKey="yhat_hi"
              dot={false}
              strokeOpacity={0}
              fillOpacity={0.18}
              name="需要レンジ（上限〜下限）"
              isAnimationActive={false}
              activeDot={false as any}
              connectNulls
            />
            {/* 下側：帯の下端（凡例には出さない） */}
            <Area
              type="monotone"
              dataKey="yhat_lo"
              dot={false}
              strokeOpacity={0}
              fillOpacity={0.18}
              name=""            // 凡例に名前を出さない
              legendType="none"  // 明示的に凡例対象外
              isAnimationActive={false}
              activeDot={false as any}
              connectNulls
            />

            {/* ▼ 予測線（破線） */}
            <Line
              type="monotone"
              dataKey="yhat"
              name="予測"
              strokeDasharray="6 4"
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            {/* ▼ 実績線（実線） */}
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
        帯が「需要レンジ（上限〜下限）」、破線が中心値の予測です。実績線は
        <code className="mx-1">actual</code>
        を渡したときのみ表示されます（未指定なら予測のみ）。
      </p>
    </div>
  );
}