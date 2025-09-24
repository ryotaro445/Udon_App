import { useEffect, useState } from "react";
import { fetchSummary, type SummaryOut } from "../api/analytics";

const ranges: Array<SummaryOut["range"]> = ["today", "7d", "30d"];

export default function SummaryKpis() {
  const [data, setData] = useState<Record<string, SummaryOut | null>>({});

  useEffect(() => {
    (async () => {
      const r: Record<string, SummaryOut> = {} as any;
      for (const range of ranges) r[range] = await fetchSummary(range);
      setData(r);
    })();
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {ranges.map((rg) => (
        <div key={rg} className="rounded-2xl shadow p-4 bg-white">
          <div className="text-sm text-gray-500">{rg.toUpperCase()}</div>
          <div className="mt-2 text-2xl font-semibold">
            ¥{(data[rg]?.total_amount ?? 0).toLocaleString()}
          </div>
          <div className="mt-1 text-sm">注文 {data[rg]?.order_count ?? 0} 件</div>
        </div>
      ))}
    </div>
  );
}