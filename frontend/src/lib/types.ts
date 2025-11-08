// frontend/src/lib/types.ts
export type ForecastPoint = {
  menu_id: number;
  ds: string;      // YYYY-MM-DD
  yhat: number;
  yhat_lo: number;
  yhat_hi: number;
};

export type HeatmapCell = {
  dow: number;  // 0..6  (Sun..Sat)
  hour: number; // 0..23
  y: number;
};