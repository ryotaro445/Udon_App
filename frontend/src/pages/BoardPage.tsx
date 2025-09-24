import React, { useEffect, useMemo, useState } from "react";

type Post = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};

const API_URL = (path: string) =>
  new URL(path, window.location.origin).toString(); // ← 相対URLエラー対策

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const disabled = useMemo(
    () => !title.trim() || !body.trim() || !author.trim(),
    [title, body, author]
  );

  const load = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(API_URL("/api/posts"));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Post[] = await res.json();
      setPosts(data);
    } catch {
      setFetchError("Request failed"); // ← テストが拾える文言
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      const res = await fetch(API_URL("/api/posts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, author }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTitle("");
      setBody("");
      setAuthor("");
      await load(); // 成功時のみ再取得
    } catch {
      setSubmitError("投稿に失敗"); // ← こちらもテストが拾える文言
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        店内掲示板（従業員向け）
      </h2>

      {fetchError && (
        <div style={{ color: "rgb(176,0,32)", marginBottom: 8 }}>
          {fetchError}
        </div>
      )}

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>新規投稿</div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="本文"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <input
            placeholder="投稿者"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />

          {submitError && (
            <div style={{ color: "rgb(176,0,32)" }}>{submitError}</div>
          )}

          <div>
            <button type="submit" disabled={disabled || loading}>
              投稿
            </button>
          </div>
        </form>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12 }}>
        {loading ? (
          <div style={{ padding: 12 }}>読み込み中…</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 12 }}>投稿はまだありません</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {posts.map((p) => (
              <li
                key={p.id}
                style={{ padding: 12, borderTop: "1px solid #eee" }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                <div style={{ marginBottom: 4 }}>{p.body}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  by {p.author} / {new Date(p.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}