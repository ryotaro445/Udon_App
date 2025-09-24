// src/components/HourlySalesCard.tsx
import React, { useMemo, useState } from "react";
import { useHourly } from "../hooks/useHourly";
import HourlySalesChart from "./HourlySalesChart";
import type { HourlyBucket } from "../api/analytics";

export default function HourlySalesCard() {
  const [days, setDays] = useState<number>(7);
  const { data, loading, error } = useHourly(days);

  const totals = useMemo(() => {
    const amount = data?.buckets.reduce((s: number, b: HourlyBucket) => s + b.amount, 0) ?? 0;
    const count = data?.buckets.reduce((s: number, b: HourlyBucket) => s + b.count, 0) ?? 0;
    return { amount, count };
  }, [data]);

  return (
    <div className="rounded-2xl shadow p-4 bg-white">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-lg font-semibold">時間帯別売上・注文件数</div>
          <div className="text-sm text-gray-500">直近の傾向を可視化（/analytics/hourly）</div>
        </div>
        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>直近7日</option>
          <option value={14}>直近14日</option>
          <option value={30}>直近30日</option>
          <option value={60}>直近60日</option>
        </select>
      </div>

      {loading && <div className="py-10 text-center text-gray-500">読み込み中...</div>}
      {error && <div className="py-10 text-center text-red-600">読み込みに失敗しました: {error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">対象日数</div>
              <div className="text-base font-semibold">{data.days} 日</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">合計売上</div>
              <div className="text-base font-semibold">
                {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(
                  data.buckets.reduce((s: number, b: HourlyBucket) => s + b.amount, 0)
                )}
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">合計注文件数</div>
              <div className="text-base font-semibold">
                {data.buckets.reduce((s: number, b: HourlyBucket) => s + b.count, 0)} 件
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">平均客単価（概算）</div>
              <div className="text-base font-semibold">
                {(() => {
                  const sumAmt = data.buckets.reduce((s: number, b: HourlyBucket) => s + b.amount, 0);
                  const sumCnt = data.buckets.reduce((s: number, b: HourlyBucket) => s + b.count, 0);
                  const avg = sumCnt ? Math.round(sumAmt / sumCnt) : 0;
                  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(avg);
                })()}
              </div>
            </div>
          </div>

          <HourlySalesChart buckets={data.buckets} />
        </>
      )}
    </div>
  );
}