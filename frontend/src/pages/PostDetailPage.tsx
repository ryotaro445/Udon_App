import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPost, createReply, Reply } from "../api/posts";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const p = await getPost(postId);
      setPost(p);
      setReplies(p.replies ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    try {
      setSubmitting(true);
      await createReply(postId, { author, body });
      setAuthor("");
      setBody("");
      await load();
    } catch (e: any) {
      setFormErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">読み込み中…</div>;
  if (err) return <div className="p-4 text-red-600">エラー: {err}</div>;
  if (!post) return <div className="p-4">見つかりませんでした。</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Link to="/" className="text-sm text-blue-600">
        ← 一覧に戻る
      </Link>

      <article className="rounded-xl border p-4">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="whitespace-pre-wrap mt-2">{post.body}</p>
        <div className="text-xs text-gray-500 mt-2">
          by {post.author} ・ {new Date(post.created_at).toLocaleString()}
        </div>
      </article>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">返信（{replies.length}）</h2>
        {replies.length === 0 ? (
          <p className="text-sm text-gray-600">まだ返信はありません。</p>
        ) : (
          <ul className="space-y-3">
            {replies.map((r) => (
              <li key={r.id} className="border rounded-lg p-3">
                <p className="whitespace-pre-wrap">{r.body}</p>
                <div className="text-xs text-gray-500 mt-1">
                  by {r.author} ・ {new Date(r.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <h3 className="font-semibold mb-2">返信を書く</h3>
        <form className="space-y-2" onSubmit={onSubmit}>
          <input
            className="border rounded w-full p-2"
            placeholder="お名前"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={30}
            required
          />
          <textarea
            className="border rounded w-full p-2 h-28"
            placeholder="本文"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            required
          />
          {formErr && <p className="text-sm text-red-600">{formErr}</p>}
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "送信中…" : "返信する"}
          </button>
        </form>
      </section>
    </div>
  );
}