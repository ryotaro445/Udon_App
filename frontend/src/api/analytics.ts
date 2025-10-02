// frontend/src/api/analytics.ts
import { http } from "./http";

/** ===== 既存 ===== */
export type SummaryOut = {
  range: "today" | "7d" | "30d";
  period_start: string;
  period_end: string;
  order_count: number;
  total_amount: number;
};

export type TopMenu = {
  menu_id: number;
  name: string;
  quantity: number;
  amount: number;
};

export type HourlyBucket = { hour: number; count: number; amount: number };
export type HourlySeriesOut = { days: number; buckets: HourlyBucket[] };

export type DailyPoint = { date: string; sales: number; orders?: number };

/** ===== メニュー別 ===== */
export type MenuTotal = { menu_id: number; name: string; orders: number; sales: number };
export type MenuDailyPoint = { date: string; orders: number; sales: number };
export type MenuHourlyBucket = { hour: number; orders: number; amount: number };
export type MenuHourlyOut = { menu_id: number; days: number; buckets: MenuHourlyBucket[] };

/** ===== Fetchers ===== */
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

export async function fetchDailySales(days: number = 14) {
  const d = Number.isFinite(days) ? days : 14;
  return http.get<DailyPoint[]>(`/api/analytics/daily-sales?days=${d}`);
}

/** ===== メニュー別 Fetchers ===== */
export async function fetchMenuTotals(days = 30, limit = 50) {
  const d = Number.isFinite(days) ? days : 30;
  const l = Number.isFinite(limit) ? limit : 50;
  return http.get<MenuTotal[]>(`/api/analytics/menu-totals?days=${d}&limit=${l}`);
}

export async function fetchMenuDaily(menuId: number, days = 14) {
  const d = Number.isFinite(days) ? days : 14;
  return http.get<MenuDailyPoint[]>(`/api/analytics/menu-daily?menu_id=${menuId}&days=${d}`);
}

export async function fetchMenuHourly(menuId: number, days = 7) {
  const d = Number.isFinite(days) ? days : 7;
  return http.get<MenuHourlyOut>(`/api/analytics/menu-hourly?menu_id=${menuId}&days=${d}`);
}