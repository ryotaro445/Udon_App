import { useEffect, useState } from "react";
import { fetchHourly, type HourlyBucket } from "../api/analytics";
import HourlySalesChart from "../components/HourlySalesChart";
import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

export default function AnalyticsPage() {
  const { mode } = useMode();
  const navigate = useNavigate();
  const [data, setData] = useState<HourlyBucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "staff" && mode !== "STAFF") navigate("/mode");
  }, [mode, navigate]);

  const load = async (days = 7) => {
    setLoading(true); setErr(null);
    try {
      const res = await fetchHourly(days);    // ★必ず数値
      setData(res.buckets ?? []);
    } catch (e:any) {
      setErr(e.message ?? "failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (mode === "staff" || mode === "STAFF") void load(7); }, [mode]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <button className="px-3 py-2 rounded bg-gray-200" onClick={() => load(7)} disabled={loading}>再取得</button>
      </div>
      {err && <div className="mb-3 p-2 rounded bg-red-100 text-red-700">{err}</div>}
      <div className="rounded border p-2">
        <HourlySalesChart buckets={data} height={300} />
      </div>
    </div>
  );
}