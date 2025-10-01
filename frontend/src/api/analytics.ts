// frontend/src/api/analytics.ts
import { http } from "./http";

export type SummaryOut = { range: "today" | "7d" | "30d"; period_start: string; period_end: string; order_count: number; total_amount: number; };
export type TopMenu = { menu_id: number; name: string; quantity: number; amount: number; };
export type HourlyBucket = { hour: number; count: number; amount: number };
export type HourlySeriesOut = { days: number; buckets: HourlyBucket[] };

export type DailyPoint = { date: string; sales: number; orders?: number };

export async function fetchSummary(range: "today" | "7d" | "30d") {
  return http.get<SummaryOut>(`/api/analytics/summary?range=${range}`);
}
export async function fetchTopMenus(limit = 5, days = 30) {
  const d = Number.isFinite(days) ? days : 30;
  return http.get<TopMenu[]>(`/api/analytics/top-menus?limit=${limit}&days=${d}`);
}
export async function fetchHourly(days: number = 7) {
  const d = Number.isFinite(days) ? days : 7;
  return http.get<HourlySeriesOut>(`/api/analytics/hourly?days=${d}`);
}
export async function fetchDailySales(days: number = 14) {           // ★ 追加
  const d = Number.isFinite(days) ? days : 14;
  return http.get<DailyPoint[]>(`/api/analytics/daily-sales?days=${d}`);
}