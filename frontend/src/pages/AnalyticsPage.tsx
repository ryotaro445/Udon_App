// src/pages/AnalyticsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchSummary,
  fetchTopMenus,
  fetchHourly,
  type TopMenu,
  type HourlyBucket,
} from "../api/analytics";

// ※ shadcn/ui を使わない場合、下2行は削って素の <div> で置き換え可
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Toast from "../components/Toast";
import HourlySalesCard from "../components/HourlySalesCard";

function yen(n: number): string {
  return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<"today" | "7d" | "30d">("today");
  const [summary, setSummary] = useState<{ total_amount: number; order_count: number } | null>(null);
  const [tops, setTops] = useState<TopMenu[]>([]);
  const [hourly, setHourly] = useState<HourlyBucket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      const [s, t, h] = await Promise.all([
        fetchSummary(range),
        fetchTopMenus(5, 30),
        fetchHourly(7),
      ]);
      setSummary({ total_amount: s.total_amount, order_count: s.order_count });
      setTops(t);
      setHourly(h.buckets);
    } catch (e: any) {
      setToast(e?.message || "分析データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const hourlyData = useMemo(
    () =>
      hourly.map((b: HourlyBucket) => ({
        hour: `${b.hour}時`,
        件数: b.count,
        金額: b.amount,
      })),
    [hourly]
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">売上分析ダッシュボード</h1>
        <div className="flex gap-2">
          <Button variant={range === "today" ? "default" : "outline"} onClick={() => setRange("today")}>
            Today
          </Button>
          <Button variant={range === "7d" ? "default" : "outline"} onClick={() => setRange("7d")}>
            7日
          </Button>
          <Button variant={range === "30d" ? "default" : "outline"} onClick={() => setRange("30d")}>
            30日
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>売上合計</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 w-40 bg-gray-200 rounded" />
            ) : (
              <div className="text-2xl font-bold">{summary ? yen(summary.total_amount) : "-"}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>注文数</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded" />
            ) : (
              <div className="text-2xl font-bold">
                {summary ? summary.order_count.toLocaleString() : "-"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>人気メニュー TOP5</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-20 w-full bg-gray-200 rounded" />
            ) : (
              <ul className="space-y-1">
                {tops.map((t) => (
                  <li key={t.menu_id} className="flex justify-between">
                    <span className="truncate">{t.name}</span>
                    <span className="tabular-nums">{t.quantity} 件</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>時間帯別の注文数・金額</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="件数" />
                <Bar dataKey="金額" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>詳細グラフ（件数×金額）</CardTitle></CardHeader>
        <CardContent>
          <HourlySalesCard />
        </CardContent>
      </Card>

      {/* Toast は type なしに変更（定義にないため） */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}