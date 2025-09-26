import { http } from "./http";

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

export async function fetchSummary(range: "today" | "7d" | "30d"): Promise<SummaryOut> {
  return http.get<SummaryOut>(`/api/analytics/summary?range=${range}`);
}

export async function fetchTopMenus(limit = 5, days = 30): Promise<TopMenu[]> {
  return http.get<TopMenu[]>(`/api/analytics/top-menus?limit=${limit}&days=${days}`);
}

export async function fetchHourly(days: number): Promise<HourlySeriesOut> {
  return http.get<HourlySeriesOut>(`/api/analytics/hourly?days=${days}`);
}