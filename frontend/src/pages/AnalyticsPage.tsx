// frontend/src/pages/AnalyticsPage.tsx
import { useEffect, useState } from "react";
import {
  fetchHourly,
  fetchDailySales,
  type HourlyBucket,
  type DailyPoint,
} from "../api/analytics";
import HourlySalesChart from "../components/HourlySalesChart";
import DailySalesChart from "../components/DailySalesChart";
import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

type Mode = "daily" | "hourly";

export default function AnalyticsPage() {
  const { mode } = useMode();
  const navigate = useNavigate();

  const [kind, setKind] = useState<Mode>("daily");   // ★ デフォルトは日別
  const [days, setDays] = useState<number>(14);
  const [hourly, setHourly] = useState<HourlyBucket[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // スタッフ以外は入れない
  useEffect(() => {
    const m = (mode || "").toUpperCase();
    if (m !== "STAFF") navigate("/mode", { replace: true });
  }, [mode, navigate]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      if (kind === "daily") {
        const d = await fetchDailySales(days);
        setDaily(d);
      } else {
        const h = await fetchHourly(days);
        setHourly(h.buckets ?? []);
      }
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [kind, days]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          <select
            aria-label="range"
            className="border rounded px-2 py-1"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7日</option>
            <option value={14}>14日</option>
            <option value={30}>30日</option>
            <option value={60}>60日</option>
          </select>
          <div className="border rounded overflow-hidden">
            <button
              className={`px-3 py-1 ${kind === "daily" ? "bg-gray-900 text-white" : ""}`}
              onClick={() => setKind("daily")}
            >
              日別
            </button>
            <button
              className={`px-3 py-1 ${kind === "hourly" ? "bg-gray-900 text-white" : ""}`}
              onClick={() => setKind("hourly")}
            >
              時間別
            </button>
          </div>
          <button className="px-3 py-1 rounded border" onClick={load} disabled={loading}>
            再取得
          </button>
        </div>
      </div>

      {err && <div className="mb-3 p-2 rounded bg-red-100 text-red-700">{err}</div>}

      <div className="rounded border p-3">
        {loading && <div>読み込み中…</div>}
        {!loading && kind === "daily" && <DailySalesChart data={daily} height={320} />}
        {!loading && kind === "hourly" && <HourlySalesChart buckets={hourly} height={320} />}
      </div>

      <div className="text-sm text-gray-500 mt-2">
        ■ 売上金額（線）／ 注文件数（点線）※日別表示時
      </div>
    </div>
  );
}