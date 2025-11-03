// frontend/src/lib/api.ts
import type { ForecastPoint, HeatmapCell } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchForecast(params: { menu_id: string | number; days?: number }): Promise<ForecastPoint[]> {
  const q = new URLSearchParams();
  q.set("menu_id", String(params.menu_id));
  if (params.days) q.set("days", String(params.days));
  const res = await fetch(`${API_BASE}/analytics/forecast?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  const json = await res.json();
  return json.data as ForecastPoint[];
}

export async function fetchHeatmap(params: { menu_id: string | number; start: string; end: string }): Promise<HeatmapCell[]> {
  const q = new URLSearchParams();
  q.set("menu_id", String(params.menu_id));
  q.set("start", params.start);
  q.set("end", params.end);
  const res = await fetch(`${API_BASE}/analytics/heatmap?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch heatmap");
  const json = await res.json();
  return json.data as HeatmapCell[];
}