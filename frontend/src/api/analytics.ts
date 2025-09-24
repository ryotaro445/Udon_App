export type SummaryOut = {
  range: "today" | "7d" | "30d";
  period_start: string; // ISO
  period_end: string;   // ISO
  order_count: number;
  total_amount: number;
};

export type TopMenu = {
  menu_id: number;
  name: string;
  quantity: number;
  amount: number;
};

export type HourlyBucket = {
  hour: number;   // 0-23
  count: number;  // 注文件数
  amount: number; // 売上金額
};

export type HourlySeriesOut = {
  days: number;
  buckets: HourlyBucket[];
};

export async function fetchSummary(range: "today" | "7d" | "30d"): Promise<SummaryOut> {
  const url = new URL("/api/analytics/summary", window.location.origin);
  url.searchParams.set("range", range);
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status}`);
  return res.json();
}

export async function fetchTopMenus(limit = 5, days = 30): Promise<TopMenu[]> {
  const url = new URL("/api/analytics/top-menus", window.location.origin);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("days", String(days));
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch top menus: ${res.status}`);
  return res.json();
}

export async function fetchHourly(days: number, signal?: AbortSignal): Promise<HourlySeriesOut> {
  const url = new URL("/api/analytics/hourly", window.location.origin);
  url.searchParams.set("days", String(days));
  const res = await fetch(url, { signal, credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch hourly: ${res.status}`);
  return res.json();
}