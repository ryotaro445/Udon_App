import type { TableInfo } from "../types";

export default function TableBanner({
  table, onClear,
}: { table: TableInfo | null; onClear: () => void }) {
  if (!table) {
    return (
      <div style={{ padding: 12, background: "#ffe8e8", borderRadius: 8, marginBottom: 12 }}>
        <b>席が未選択です。</b> 右上の「スキャン」からQRを読み取り、テーブルを選択してください。
      </div>
    );
  }
  return (
    <div style={{
      padding: 12, background: "#e8f7ff", borderRadius: 8, marginBottom: 12,
      display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between"
    }}>
      <div>現在のテーブル: <b>{table.name}</b> <small>({table.code})</small></div>
      <button onClick={onClear} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #aaa" }}>
        変更
      </button>
    </div>
  );
}