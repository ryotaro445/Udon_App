// frontend/src/lib/api/analytics.ts
export type ForecastPoint = {
  menu_id: number;
  ds: string;
  yhat: number;
  yhat_lo: number;
  yhat_hi: number;
};
export type HeatmapCell = { dow: number; hour: number; y: number };
export type ActualPoint = { menu_id: number; ds: string; y: number };

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// GET /api/analytics/forecast?menu_id=<id|all>&days=7
export async function fetchForecast(params: { menuId: number | "all"; days?: number }): Promise<ForecastPoint[]> {
  const url = new URL(`${API_BASE}/api/analytics/forecast`);
  url.searchParams.set("menu_id", String(params.menuId));
  if (params.days != null) url.searchParams.set("days", String(params.days));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`fetchForecast failed: ${res.status}`);
  const js = await res.json();
  // ← ここが重要：{data: []} でも配列でも吸収
  return Array.isArray(js) ? js : (js?.data ?? []);
}

// GET /api/analytics/heatmap?menu_id=<id|all>&start=YYYY-MM-DD&end=YYYY-MM-DD
export async function fetchHeatmap(params: { menuId: number | "all"; start: string; end: string }): Promise<HeatmapCell[]> {
  const url = new URL(`${API_BASE}/api/analytics/heatmap`);
  url.searchParams.set("menu_id", String(params.menuId));
  url.searchParams.set("start", params.start);
  url.searchParams.set("end", params.end);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`fetchHeatmap failed: ${res.status}`);
  const js = await res.json();
  return Array.isArray(js) ? js : (js?.data ?? []);
}

// 実績APIが未実装なら空配列を返す
export async function fetchActualPlaceholder(_p: { menuId: number; start: string; end: string }): Promise<ActualPoint[]> {
  return [];
}