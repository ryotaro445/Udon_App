import { useEffect, useState } from "react";
import { Post, getPosts } from "../api/posts";
import { NewPostModal } from "../ui/NewPostModal";
import { useNavigate } from "react-router-dom";

export default function PostsListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setPosts(await getPosts(20, 0));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">掲示板</h1>
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={() => setOpen(true)}
        >
          新規投稿
        </button>
      </div>

      {loading && <p>読み込み中…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && posts.length === 0 && <p>投稿はまだありません。</p>}

      <div className="space-y-3">
        {posts.map((p) => (
          <article
            key={p.id}
            className="rounded-xl border p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/posts/${p.id}`)}
          >
            <h2 className="font-semibold text-lg">{p.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2">{p.body}</p>
            <div className="text-xs text-gray-500 mt-2">
              by {p.author} ・ {new Date(p.created_at).toLocaleString()}
            </div>
          </article>
        ))}
      </div>

      {open && <NewPostModal onClose={() => setOpen(false)} onCreated={load} />}
    </div>
  );
}