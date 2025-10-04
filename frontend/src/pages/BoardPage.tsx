import { useEffect, useState } from "react";
import { fetchPosts, createPost, deletePost, type Post } from "../api/posts";

export default function BoardPage({ canPost = false }: { canPost?: boolean }) {
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

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setLoading(true);
    setErr(null);
    try {
      await createPost({ title, body, author: "staff" });
      setTitle("");
      setBody("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!canPost) return;
    const keep = posts;
    setPosts((p) => p.filter((x) => x.id !== id));
    try {
      await deletePost(id);
    } catch {
      setErr("削除に失敗");
      setPosts(keep);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">掲示板</h1>
      {err && <div className="p-2 rounded bg-red-100 text-red-700">{err}</div>}

      {/* 投稿UI（スタッフのみ） */}
      {canPost && (
        <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-4 space-y-3 shadow-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            className="border rounded-md w-full px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="本文"
            className="border rounded-md w-full min-h-[120px] px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          />
          <div className="text-right">
            <button
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-black text-white font-semibold shadow hover:bg-gray-800 disabled:opacity-40"
            >
              投稿
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-slate-600 whitespace-pre-wrap mt-1">{p.body}</div>
              </div>
              {canPost && (
                <button
                  onClick={() => onDelete(p.id)}
                  className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              )}
            </div>
          </li>
        ))}
        {posts.length === 0 && <li className="text-slate-500">投稿がありません</li>}
      </ul>
    </main>
  );
}