// src/pages/BoardPage.tsx
import { useEffect, useState } from "react";
import { fetchPosts, createPost, deletePost, type Post } from "../api/posts";

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(null);
    try {
      const list = await fetchPosts(50);
      setPosts(list);
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
    }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await createPost({ title, body, author: "guest" });
      setTitle(""); setBody("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "投稿に失敗");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    const keep = posts;
    setPosts(p => p.filter(x => x.id !== id)); // 楽観的更新
    try {
      await deletePost(id);
    } catch {
      setErr("削除に失敗");
      setPosts(keep); // ロールバック
    }
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-bold">掲示板</h1>
      {err && <div className="text-red-600">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-2">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="タイトル" className="border px-2 py-1 rounded w-full" />
        <textarea value={body}  onChange={e=>setBody(e.target.value)}  placeholder="本文"     className="border px-2 py-1 rounded w-full min-h-[120px]" />
        <button disabled={loading} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">投稿</button>
      </form>

      <ul className="divide-y">
        {posts.map(p => (
          <li key={p.id} className="py-3 flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{p.body}</div>
            </div>
            <button
              onClick={() => onDelete(p.id)}
              className="px-3 py-1 rounded border text-red-600 border-red-300 hover:bg-red-50"
              aria-label={`投稿 ${p.id} を削除`}
              data-testid={`btn-delete-${p.id}`}
            >
              削除
            </button>
          </li>
        ))}
        {posts.length === 0 && <li className="text-slate-500">投稿がありません</li>}
      </ul>
    </main>
  );
}