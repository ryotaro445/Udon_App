import { useState } from "react";
import { createPost } from "../api/posts";

export function NewPostModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      setSubmitting(true);
      await createPost({ title, body, author });
      onClose();
      onCreated();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">新規投稿</h2>
          <button onClick={onClose} className="text-gray-500">
            ×
          </button>
        </div>
        <form className="space-y-2" onSubmit={submit}>
          <input
            className="border rounded w-full p-2"
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
          />
          <input
            className="border rounded w-full p-2"
            placeholder="お名前"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={30}
            required
          />
          <textarea
            className="border rounded w-full p-2 h-40"
            placeholder="本文"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-2 rounded border"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "作成中…" : "投稿する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}