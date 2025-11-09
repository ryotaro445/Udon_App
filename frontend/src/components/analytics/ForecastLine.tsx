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

type ForecastPoint = {
  ds: string;      // 日付 (ISO 文字列)
  yhat: number;    // 予測値
  yhat_lo: number; // 下限
  yhat_hi: number; // 上限
};

type ActualPoint = {
  ds: string;
  y: number;
};

type Props = {
  title?: string;
  forecast: ForecastPoint[];   // 7日先など未来を含む配列
  actual?: ActualPoint[];      // 過去実績（任意）
  dateFormat?: (ds: string) => string;
};

/**
 * 実績（実線）＋予測（破線）＋予測区間（薄いオレンジの帯）をまとめて表示。
 * 入力は別配列でもOK。日付キーで結合して1系列に整形します。
 */
export default function ForecastLine({
  title = "Forecast",
  forecast,
  actual = [],
  dateFormat,
}: Props) {
  // ds（日付）で結合：{ ds, actual?, yhat?, yhat_lo?, yhat_hi?, bandSpan }
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

    // 下限〜上限の幅（帯用）
    for (const row of byDs.values()) {
      const lo = Number(row.yhat_lo ?? 0);
      const hi = Number(row.yhat_hi ?? 0);
      row.bandSpan = Math.max(hi - lo, 0);
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

            {/* カスタムツールチップ：日付 → 上限 → 需要予測値 → 下限 */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row: any = payload[0].payload;
                const hi = row.yhat_hi ?? row.yhat;
                const lo = row.yhat_lo ?? row.yhat;
                const mid = row.yhat ?? (hi + lo) / 2;

                const fmt = (n: number) => n.toLocaleString();

                return (
                  <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-md">
                    <div className="font-semibold mb-1">
                      日付: {formatX(String(label ?? row.ds))}
                    </div>
                    <div>上限：{fmt(hi)}</div>
                    <div>需要予測値：{fmt(mid)}</div>
                    <div>下限：{fmt(lo)}</div>
                  </div>
                );
              }}
            />

            <Legend
              formatter={(value) => {
                if (value === "bandSpan") return "上限〜下限の範囲";
                if (value === "yhat") return "需要予測値";
                if (value === "actual") return "実績";
                return value;
              }}
            />

            {/* ───────── 帯（下限〜上限の範囲）───────── */}
            {/* 1. 下限部分（透明） */}
            <Area
              type="monotone"
              dataKey="yhat_lo"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              activeDot={false as any}
              name="__band_bottom" // Legendに出さないダミー
            />
            {/* 2. 幅だけオレンジで塗る */}
            <Area
              type="monotone"
              dataKey="bandSpan"
              stackId="band"
              stroke="none"
              fill="rgba(249, 115, 22, 0.25)" // 薄いオレンジ
              isAnimationActive={false}
              activeDot={false as any}
              name="bandSpan"
            />

            {/* 予測線（破線） */}
            <Line
              type="monotone"
              dataKey="yhat"
              name="yhat"
              strokeWidth={2}
              stroke="#2563eb" // 青
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />

            {/* 実績線（実線） - 実績があるときだけ表示 */}
            {data.some((d) => d.actual != null) && (
              <Line
                type="monotone"
                dataKey="actual"
                name="actual"
                strokeWidth={2}
                stroke="#111827"
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