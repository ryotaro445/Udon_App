import { useEffect, useState } from "react";
import {
  fetchHourly,
  fetchDailySales,
  type HourlyBucket,
  type DailyPoint,
  type MenuTotal,
} from "../api/analytics";
import HourlySalesChart from "../components/HourlySalesChart";
import DailySalesChart from "../components/DailySalesChart";
import MenuTotalsChart from "../components/MenuTotalsChart";
import MenuDailyChart from "../components/MenuDailyChart";
import MenuHourlyChart from "../components/MenuHourlyChart";
import { useNavigate } from "react-router-dom";
import { useMode } from "../context/ModeCtx";

type Tab = "daily" | "hourly" | "menu";
type MenuView = "daily" | "hourly";

export default function AnalyticsPage() {
  const { mode } = useMode();
  const navigate = useNavigate();

  // ====== 全体タブ ======
  const [tab, setTab] = useState<Tab>("daily");
  const [days, setDays] = useState<number>(14);
  const [hourly, setHourly] = useState<HourlyBucket[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ====== メニュー別 ======
  const [picked, setPicked] = useState<MenuTotal | null>(null);
  const [menuView, setMenuView] = useState<MenuView>("daily");
  const [menuDays, setMenuDays] = useState<number>(14);   // 日別
  const [menuHourlyDays, setMenuHourlyDays] = useState<number>(7); // 時間別

  // スタッフ以外は入れない
  useEffect(() => {
    const m = (mode || "").toUpperCase();
    if (m !== "STAFF") navigate("/mode", { replace: true });
  }, [mode, navigate]);

  const load = async () => {
    if (tab === "menu") return; // メニュー別は子コンポーネント内で取得
    setLoading(true);
    setErr(null);
    try {
      if (tab === "daily") {
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

  useEffect(() => { void load(); }, [tab, days]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Analytics</h1>

        {/* 右上の操作群（全体 or メニュー別で内容切替） */}
        {tab !== "menu" ? (
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
                className={`px-3 py-1 ${tab === "daily" ? "bg-gray-900 text-white" : ""}`}
                onClick={() => setTab("daily")}
              >
                日別
              </button>
              <button
                className={`px-3 py-1 ${tab === "hourly" ? "bg-gray-900 text-white" : ""}`}
                onClick={() => setTab("hourly")}
              >
                時間別
              </button>
              <button
                className={`px-3 py-1 ${tab === "menu" ? "bg-gray-900 text-white" : ""}`}
                onClick={() => setTab("menu")}
              >
                メニュー別
              </button>
            </div>
            <button className="px-3 py-1 rounded border" onClick={load} disabled={loading}>
              再取得
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* メニュー別：ビュー切替 */}
            <select
              aria-label="menu-days"
              className="border rounded px-2 py-1"
              value={menuView === "daily" ? menuDays : menuHourlyDays}
              onChange={(e) =>
                menuView === "daily"
                  ? setMenuDays(Number(e.target.value))
                  : setMenuHourlyDays(Number(e.target.value))
              }
            >
              <option value={7}>7日</option>
              <option value={14}>14日</option>
              <option value={30}>30日</option>
            </select>
            <div className="border rounded overflow-hidden">
              <button
                className={`px-3 py-1 ${menuView === "daily" ? "bg-gray-900 text-white" : ""}`}
                onClick={() => setMenuView("daily")}
              >
                日別（メニュー）
              </button>
              <button
                className={`px-3 py-1 ${menuView === "hourly" ? "bg-gray-900 text-white" : ""}`}
                onClick={() => setMenuView("hourly")}
              >
                時間別（メニュー）
              </button>
            </div>
          </div>
        )}
      </div>

      {err && tab !== "menu" && (
        <div className="mb-3 p-2 rounded bg-red-100 text-red-700">{err}</div>
      )}

      {/* 本体 */}
      {tab !== "menu" ? (
        <div className="rounded border p-3">
          {loading && <div>読み込み中…</div>}
          {!loading && tab === "daily" && <DailySalesChart data={daily} height={320} />}
          {!loading && tab === "hourly" && <HourlySalesChart buckets={hourly} height={320} />}
          <div className="text-sm text-gray-500 mt-2">
            ■ 売上金額（線）／ 注文件数（点線）※日別表示時
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded border p-3">
            {/* メニュー別 合計（クリックで選択） */}
            <MenuTotalsChart days={30} limit={50} onPickMenu={setPicked} />
            <div className="text-xs text-gray-500 mt-2">
              棒をクリックすると下段に「{menuView === "daily" ? "日別" : "時間別"}」推移を表示
            </div>
          </div>

          <div className="rounded border p-3">
            {menuView === "daily" ? (
              <MenuDailyChart picked={picked} days={menuDays} />
            ) : (
              <MenuHourlyChart picked={picked} days={menuHourlyDays} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}