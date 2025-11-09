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

export type ForecastPoint = {
  ds: string;      // 日付 (ISO文字列)
  yhat: number;   // 予測値
  yhat_lo: number; // 下限
  yhat_hi: number; // 上限
};

export type ActualPoint = {
  ds: string;
  y: number;
};

type Props = {
  title?: string;
  forecast: ForecastPoint[];   // 未来を含む予測配列
  actual?: ActualPoint[];      // 任意：実績
  dateFormat?: (ds: string) => string;
};

/**
 * 実績（実線）＋予測（破線）＋上限〜下限の帯（薄いオレンジ）をまとめて表示
 */
export default function ForecastLine({
  title = "Forecast",
  forecast,
  actual = [],
  dateFormat,
}: Props) {
  // ds(日付)でマージ：{ ds, yhat, yhat_lo, yhat_hi, actual? }
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

    return Array.from(byDs.values()).sort((a, b) => a.ds.localeCompare(b.ds));
  }, [forecast, actual]);

  const formatX = (iso: string) => (dateFormat ? dateFormat(iso) : iso);

  return (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-lg font-semibold">{title}</div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 12, right: 24, bottom: 8, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="ds"
              tickFormatter={formatX}
              minTickGap={24}
              style={{ fontSize: 12 }}
            />
            <YAxis width={56} style={{ fontSize: 12 }} />

            <Tooltip
              formatter={(raw: any, name: string) => {
                const v =
                  typeof raw === "number" ? Math.round(raw).toLocaleString() : raw;
                if (name === "yhat_hi") return [v, "上限"];
                if (name === "yhat") return [v, "需要予測値"];
                if (name === "yhat_lo") return [v, "下限"];
                return [v, name];
              }}
              labelFormatter={(l) => `日付: ${formatX(String(l))}`}
              // 表示順: 上限 → 需要予測値 → 下限
              itemSorter={(item: any) => {
                const order: Record<string, number> = {
                  yhat_hi: 0,
                  yhat: 1,
                  yhat_lo: 2,
                };
                return order[item.dataKey as string] ?? 99;
              }}
            />

            <Legend />

            {/* 下限〜上限の帯（stackId を使って差分だけオレンジにする） */}
            {/* 1本目: 下限（透明・凡例非表示） */}
            <Area
              type="monotone"
              dataKey="yhat_lo"
              stackId="band"
              stroke="none"
              fill="rgba(0,0,0,0)" // 完全透明
              legendType="none"
              isAnimationActive={false}
              activeDot={false as any}
              connectNulls
            />
            {/* 2本目: 上限（下限との差分がオレンジで塗られる） */}
            <Area
              type="monotone"
              dataKey="yhat_hi"
              stackId="band"
              name="上限〜下限の範囲"
              stroke="none"
              fill="rgba(249, 115, 22, 0.25)" // 薄いオレンジ
              isAnimationActive={false}
              activeDot={false as any}
              connectNulls
            />

            {/* 需要予測値（破線） */}
            <Line
              type="monotone"
              dataKey="yhat"
              name="需要予測値"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />

            {/* 実績線（ある場合のみ表示） */}
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