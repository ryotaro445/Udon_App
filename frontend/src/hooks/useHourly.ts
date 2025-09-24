// src/hooks/useHourly.ts
import { useEffect, useState } from "react";
import { fetchHourly, type HourlySeriesOut } from "../api/analytics";

export function useHourly(days: number) {
  const [data, setData] = useState<HourlySeriesOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    fetchHourly(days, ac.signal)
      .then((d) => setData(d))
      .catch((e: any) => {
        if (e?.name !== "AbortError") setError(e?.message || "failed");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [days]);

  return { data, loading, error };
}