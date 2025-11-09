// frontend/src/pages/AnalyticsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchHourly,
  fetchDailySales,
  fetchForecast,
  type HourlyBucket,
  type DailyPoint,
  type MenuTotal,
} from "../api/analytics";
import HourlySalesChart from "../components/HourlySalesChart";
import DailySalesChart from "../components/DailySalesChart";
import MenuTotalsChart from "../components/MenuTotalsChart";
import MenuDailyChart from "../components/MenuDailyChart";
import MenuHourlyChart from "../components/MenuHourlyChart";
import ForecastLine from "../components/ForecastLine";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMode } from "../context/ModeCtx";
import { http } from "../api/http";
import type { ForecastPoint } from "@/types/analytics";

type Tab = "daily" | "hourly" | "menu" | "forecast" | "heatmap";
type MenuView = "daily" | "hourly";

/** UI 用の予測行データ（ForecastLine と同じ形） */
type ForecastRow = ForecastPoint;

type HeatmapCell = { dow: number; hour: number; y: number };

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsPage() {
  const { mode } = useMode();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // mode guard
  useEffect(() => {
    const m = (mode || "").toUpperCase();
    if (m !== "STAFF") navigate("/mode", { replace: true });
  }, [mode, navigate]);

  // tab from query
  const initialTab = (() => {
    const t = (sp.get("tab") || "").toLowerCase();
    if (["daily", "hourly", "menu", "forecast", "heatmap"].includes(t)) return t as Tab;
    return "daily";
  })();
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set("tab", tab);
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // existing states
  const [days, setDays] = useState<number>(14);
  const [hourly, setHourly] = useState<HourlyBucket[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [picked, setPicked] = useState<MenuTotal | null>(null);
  const [menuView, setMenuView] = useState<MenuView>("daily");
  const [menuDays, setMenuDays] = useState<number>(14);
  const [menuHourlyDays, setMenuHourlyDays] = useState<number>(7);

  // forecast / heatmap
  const [forecastMenuId, setForecastMenuId] = useState<number | "all">("all");
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [forecast, setForecast] = useState<ForecastRow[]>([]);

  const [hmMenuId, setHmMenuId] = useState<number | "all">("all");
  const today = useMemo(() => new Date(), []);
  const dateFmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const [hmStart, setHmStart] = useState<string>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 28);
    return dateFmt(d);
  });
  const [hmEnd, setHmEnd] = useState<string>(() => dateFmt(today));
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);

  // load daily/hourly
  const load = async () => {
    if (tab === "menu" || tab === "forecast" || tab === "heatmap") return;
    setLoading(true);
    setErr(null);
    try {
      if (tab === "daily") {
        const d = await fetchDailySales(days);
        setDaily(d);
      } else if (tab === "hourly") {
        const h = await fetchHourly(days);
        setHourly(h.buckets ?? []);
      }
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, days]);

  // forecast
  const loadForecast = async () => {
    if (forecastMenuId == null || forecastDays == null) return;
    setLoading(true);
    setErr(null);
    try {
      // staff token 付きで API を叩く
      const out = await fetchForecast(forecastMenuId, forecastDays);
      // out.data: [{ date, y }]
      const rows: ForecastRow[] = (out.data || []).map((p) => {
        const y = p.y ?? 0;
        const lo = Math.round(y * 0.9);
        const hi = Math.round(y * 1.1);
        return {
          ds: p.date,
          yhat: y,
          yhat_lo: lo,
          yhat_hi: hi,
        };
      });
      setForecast(rows);
    } catch (e: any) {
      setErr(e?.message ?? "予測の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (tab === "forecast") void loadForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, forecastMenuId, forecastDays]);

  // heatmap
  const loadHeatmap = async () => {
    if (!hmStart || !hmEnd) return;
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams();
      q.set("menu_id", String(hmMenuId));
      q.set("start", hmStart);
      q.set("end", hmEnd);
      const js = await http.get<unknown>(`/api/analytics/heatmap?${q.toString()}`);
      const rows: HeatmapCell[] = Array.isArray(js)
        ? (js as HeatmapCell[])
        : ((js as any)?.data ?? []);
      setHeatmap(rows);
    } catch (e: any) {
      setErr(e?.message ?? "ヒートマップの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (tab === "heatmap") void loadHeatmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, hmMenuId, hmStart, hmEnd]);

  // heatmap matrix
  const hmMatrix = useMemo(() => {
    const m = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    for (const c of heatmap) {
      if (c.dow >= 0 && c.dow < 7 && c.hour >= 0 && c.hour < 24) {
        m[c.dow][c.hour] = c.y ?? 0;
        if (c.y > max) max = c.y;
      }
    }
    return { m, max };
  }, [heatmap]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4 [writing-mode:horizontal-tb]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">売上分析</h1>

        {/* タブ & コントロール */}
        <div className="flex items-center gap-2">
          {tab === "daily" || tab === "hourly" ? (
            <select
              aria-label="range"
              className="border rounded-md px-2 py-2 border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>7日</option>
              <option value={14}>14日</option>
              <option value={30}>30日</option>
              <option value={60}>60日</option>
            </select>
          ) : tab === "menu" ? (
            <select
              aria-label="menu-days"
              className="border rounded-md px-2 py-2 border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
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
          ) : tab === "forecast" ? (
            <div className="flex items-center gap-2">
              <select
                className="border rounded-md px-2 py-2 border-sky-300"
                value={forecastMenuId === "all" ? "all" : String(forecastMenuId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setForecastMenuId(v === "all" ? "all" : Number(v));
                }}
              >
                <option value="all">All</option>
                <option value="1">Menu #1</option>
                <option value="2">Menu #2</option>
                <option value="3">Menu #3</option>
              </select>
              <select
                className="border rounded-md px-2 py-2 border-sky-300"
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
              >
                <option value={7}>7日</option>
                <option value={14}>14日</option>
                <option value={21}>21日</option>
              </select>
            </div>
          ) : tab === "heatmap" ? (
            <div className="flex items-center gap-2">
              <select
                className="border rounded-md px-2 py-2 border-sky-300"
                value={hmMenuId === "all" ? "all" : String(hmMenuId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setHmMenuId(v === "all" ? "all" : Number(v));
                }}
              >
                <option value="all">All</option>
                <option value="1">Menu #1</option>
                <option value="2">Menu #2</option>
                <option value="3">Menu #3</option>
              </select>
              <input
                type="date"
                className="border rounded-md px-2 py-2 border-sky-300"
                value={hmStart}
                onChange={(e) => setHmStart(e.target.value)}
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                className="border rounded-md px-2 py-2 border-sky-300"
                value={hmEnd}
                onChange={(e) => setHmEnd(e.target.value)}
              />
            </div>
          ) : null}

          <div className="rounded-lg overflow-hidden border border-sky-700">
            {(["daily", "hourly", "menu", "forecast", "heatmap"] as Tab[]).map((t) => (
              <button
                key={t}
                className={`px-3 py-2 ${
                  tab === t
                    ? "bg-gradient-to-b from-sky-600 to-sky-700 text-white"
                    : "text-sky-700 hover:bg-sky-50"
                }`}
                onClick={() => setTab(t)}
              >
                {t === "daily" && "日別"}
                {t === "hourly" && "時間別"}
                {t === "menu" && "メニュー別"}
                {t === "forecast" && "予測"}
                {t === "heatmap" && "ヒートマップ"}
              </button>
            ))}
          </div>

          {(tab === "daily" || tab === "hourly") && (
            <button
              className="px-4 py-2 rounded-lg border border-sky-700 text-sky-700 bg-white hover:bg-sky-50 disabled:opacity-40"
              onClick={load}
              disabled={loading}
            >
              再取得
            </button>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {err && tab !== "menu" && (
        <div className="p-2 rounded bg-red-100 text-red-700">{err}</div>
      )}

      {/* 本体 */}
      {tab === "daily" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {loading ? <div>読み込み中…</div> : <DailySalesChart data={daily} height={320} />}
          <div className="text-sm text-gray-500 mt-2">■ 売上金額（線）／ 注文件数（点線）</div>
        </div>
      )}

      {tab === "hourly" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {loading ? <div>読み込み中…</div> : <HourlySalesChart buckets={hourly} height={320} />}
        </div>
      )}

      {tab === "menu" && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <MenuTotalsChart days={30} limit={50} onPickMenu={setPicked} />
            <div className="text-xs text-gray-500 mt-2">
              棒をクリックすると下段に「{menuView === "daily" ? "日別" : "時間別"}」推移を表示
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2">
              <div className="rounded-lg overflow-hidden border border-sky-700 inline-block">
                <button
                  className={`px-4 py-2 ${
                    menuView === "daily"
                      ? "bg-gradient-to-b from-sky-600 to-sky-700 text-white"
                      : "text-sky-700 hover:bg-sky-50"
                  }`}
                  onClick={() => setMenuView("daily")}
                >
                  日別（メニュー）
                </button>
                <button
                  className={`px-4 py-2 ${
                    menuView === "hourly"
                      ? "bg-gradient-to-b from-sky-600 to-sky-700 text-white"
                      : "text-sky-700 hover:bg-sky-50"
                  }`}
                  onClick={() => setMenuView("hourly")}
                >
                  時間別（メニュー）
                </button>
              </div>
            </div>
            {menuView === "daily" ? (
              <MenuDailyChart picked={picked} days={menuDays} />
            ) : (
              <MenuHourlyChart picked={picked} days={menuHourlyDays} />
            )}
          </div>
        </div>
      )}

      {tab === "forecast" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          {loading ? (
            <div>読み込み中…</div>
          ) : forecast.length === 0 ? (
            <div className="text-gray-500 text-sm">予測データがありません</div>
          ) : (
            <ForecastLine title="7日間の売上予測" forecast={forecast} />
          )}
        </div>
      )}

      {tab === "heatmap" && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          {loading ? (
            <div>読み込み中…</div>
          ) : (
            <div className="overflow-x-auto">
              <div
                className="inline-grid"
                style={{ gridTemplateColumns: `80px repeat(24, minmax(24px, 1fr))` }}
              >
                <div />
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="text-[10px] text-gray-500 text-center px-1 py-0.5">
                    {h}
                  </div>
                ))}
                {hmMatrix.m.map((row, d) => (
                  <div className="contents" key={`row-${d}`}>
                    <div className="text-xs font-medium text-gray-600 px-2 py-1 sticky left-0 bg-white">
                      {DOW_LABELS[d]}
                    </div>
                    {row.map((val, h) => {
                      const intensity = hmMatrix.max ? val / hmMatrix.max : 0;
                      const bg = `rgba(30,144,255, ${0.15 + 0.7 * intensity})`;
                      return (
                        <div
                          key={`${d}-${h}`}
                          className="border border-gray-100 text-[10px] text-center"
                          style={{ background: bg, padding: "6px" }}
                          title={`dow=${d} hour=${h} y=${val}`}
                        >
                          {val > 0 ? Math.round(val) : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {hmStart}〜{hmEnd} の合計数量（menu_id={String(hmMenuId)}）。
          </div>
        </div>
      )}
    </div>
  );
}