export type ForecastPoint = {
  menu_id: number;
  ds: string;           // ISO date (e.g., "2025-10-31")
  yhat: number;
  yhat_lo: number;
  yhat_hi: number;
};

export type ActualPoint = {
  menu_id: number;
  ds: string;           // ISO date
  y: number;            // actual quantity
};

export type HeatmapCell = {
  dow: number;          // 0=Sun, 1=Mon, ... 6=Sat
  hour: number;         // 0..23
  y: number;            // count/qty
};