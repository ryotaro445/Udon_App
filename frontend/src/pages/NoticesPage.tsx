// src/pages/NoticesPage.tsx
import { useEffect, useState } from "react";
import { fetchPosts } from "../api/posts";
import type { Post } from "../types";

export default function NoticesPage() {
  const [rows, setRows] = useState<Post[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts(100)
      .then(setRows)
      .catch((e) => setErr(e?.message || "読み込みに失敗しました"));
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 12px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>お知らせ</h1>
      {err && <div style={{ color: "#b00020", marginBottom: 8 }}>{err}</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {rows.length === 0 && <div>現在、お知らせはありません。</div>}
        {rows.map((p) => (
          <article key={p.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{p.title}</h2>
              <time style={{ fontSize: 12, opacity: 0.7 }}>
                {new Date(p.created_at).toLocaleDateString()}
              </time>
            </div>
            <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{p.body}</div>
          </article>
        ))}
      </div>
    </div>
  );
}