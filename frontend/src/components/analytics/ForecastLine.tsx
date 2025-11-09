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

// 予測ポイント & 実績ポイントの型
export type ForecastPoint = {
  ds: string;
  yhat: number;
  yhat_lo: number;
  yhat_hi: number;
};

export type ActualPoint = {
  ds: string;
  y: number;
};

type Props = {
  title?: string;
  forecast: ForecastPoint[]; // 未来を含む予測配列
  actual?: ActualPoint[]; // 過去実績（任意）
  dateFormat?: (ds: string) => string;
};

export default function ForecastLine({
  title = "Forecast",
  forecast,
  actual = [],
  dateFormat,
}: Props) {
  // ds（日付）で結合しつつ、帯描画用の値も作る
  const data = useMemo(() => {
    const byDs = new Map<string, any>();

    // 予測値をマージ
    for (const f of forecast) {
      byDs.set(f.ds, {
        ds: f.ds,
        yhat: f.yhat,
        yhat_lo: f.yhat_lo,
        yhat_hi: f.yhat_hi,
      });
    }

    // 実績値をマージ（あれば）
    for (const a of actual) {
      const row = byDs.get(a.ds) ?? { ds: a.ds };
      row.actual = a.y;
      byDs.set(a.ds, row);
    }

    // 下限〜上限の「帯」用に base + range を追加
    const arr = Array.from(byDs.values()).map((row) => {
      const lo = Number(row.yhat_lo ?? 0);
      const hi = Number(row.yhat_hi ?? 0);
      return {
        ...row,
        bandBase: lo,
        bandRange: Math.max(hi - lo, 0), // マイナスにならないように
      };
    });

    // X軸が時間順になるようソート
    return arr.sort((a, b) => String(a.ds).localeCompare(String(b.ds)));
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

            {/* カスタムツールチップ： 日付 → 上限 → 需要予測値 → 下限 */}
            <Tooltip
              content={(props) => {
                const { active, payload, label } = props;
                if (!active || !payload || payload.length === 0) return null;
                const row: any = payload[0].payload ?? {};
                const hi = Number(row.yhat_hi ?? 0);
                const lo = Number(row.yhat_lo ?? 0);
                const mid = Number(row.yhat ?? 0);

                const nf = (v: number) => v.toLocaleString();

                return (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 13,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      日付: {formatX(String(label ?? row.ds))}
                    </div>
                    <div>上限：{nf(hi)}</div>
                    <div>需要予測値：{nf(mid)}</div>
                    <div>下限：{nf(lo)}</div>
                  </div>
                );
              }}
            />

            <Legend />

            {/* ---- 上限〜下限の帯（オレンジ） ---- */}
            {/* 下限を土台として stackId="band" で積み上げる */}
            <Area
              type="monotone"
              dataKey="bandBase"
              stackId="band"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
              activeDot={false as any}
            />
            <Area
              type="monotone"
              dataKey="bandRange"
              stackId="band"
              stroke="none"
              fill="rgba(249, 115, 22, 0.25)" // 薄いオレンジ帯
              name="上限〜下限の範囲"
              isAnimationActive={false}
              activeDot={false as any}
            />

            {/* 需要予測値（破線） */}
            <Line
              type="monotone"
              dataKey="yhat"
              name="需要予測値"
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
            />

            {/* 実績線（あれば表示） */}
            {data.some((d) => d.actual != null) && (
              <Line
                type="monotone"
                dataKey="actual"
                name="実績"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}