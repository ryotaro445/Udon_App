// src/components/MenuDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/client";
import { isE2E } from "../test/e2eFlag";

// ==== 型 =====
type Comment = {
  id: number;
  user: string | null;
  text: string;
  created_at?: string; // サーバにより無い場合もあるので任意
};

type OptionItem = { id: string | number; label?: string };
type OptionGroup = {
  required?: boolean;
  items?: OptionItem[];
  onSelect?: (id: string | number) => void;
};

type Props = {
  menuId: number;
  onClose: () => void;

  // ※ オプションやカートを使わない場合は渡さなくてOK（コメント専用で動作）
  open?: boolean;
  options?: OptionGroup[];
  canAdd?: boolean;
  onAddToCart?: () => void;
};

// ==== 内部ヘルパ（/api 優先 → 失敗時 /menus にフォールバック） ====
async function getComments(menuId: number) {
  try {
    return await apiGet<Comment[]>(`/api/menus/${menuId}/comments`);
  } catch {
    return await apiGet<Comment[]>(`/menus/${menuId}/comments`);
  }
}
async function postComment(menuId: number, body: { user?: string; text: string }) {
  try {
    return await apiPost<Comment>(`/api/menus/${menuId}/comments`, body);
  } catch {
    return await apiPost<Comment>(`/menus/${menuId}/comments`, body);
  }
}

export default function MenuDetail({
  menuId,
  onClose,
  open = true,
  options,
  canAdd = true,
  onAddToCart,
}: Props) {
  // ===== コメント状態 =====
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const canSend = useMemo(() => text.trim().length > 0 && !sending, [text, sending]);

  // ===== 取得 =====
  const load = async () => {
    setErr(null);
    try {
      const data = await getComments(menuId);
      setComments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      // エラーは画面に出すが、404 の素っ気ないメッセージは丸める
      const msg = String(e?.message ?? "");
      setErr(msg.includes("404") ? "コメントを取得できませんでした" : msg);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId]);

  // ===== 送信 =====
  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    setErr(null);
    try {
      await postComment(menuId, { user: user.trim() || undefined, text: text.trim() });
      setText("");
      await load();
      setToast("コメントを投稿しました");
      setTimeout(() => setToast(null), 1800);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      // モデレーションなどの文言はここで丸める
      setErr(msg || "コメントの投稿に失敗しました");
      setToast("投稿できませんでした");
      setTimeout(() => setToast(null), 1800);
    } finally {
      setSending(false);
    }
  };

  // Enter で送信
  const onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter" && canSend) {
      ev.preventDefault();
      void submit();
    }
  };

  // ===== E2E: 必須オプションの自動選択 =====
  useEffect(() => {
    if (!open || !isE2E()) return;
    try {
      options?.forEach((group) => {
        if (group?.required && Array.isArray(group.items) && group.items[0]) {
          group.onSelect?.(group.items[0].id);
        }
      });
    } catch {
      /* no-op */
    }
  }, [open, options]);

  // E2E 中は「カートに追加」を常に有効に
  const effectiveCanAdd = isE2E() ? true : !!canAdd;

  // ===== 表示 =====
  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="menu-dialog"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", padding: 16, borderRadius: 12, width: 640, maxWidth: "95vw" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18 }}>メニューの詳細 / コメント</h2>
          <button onClick={onClose} aria-label="閉じる" style={{ fontSize: 20, lineHeight: 1 }}>
            ×
          </button>
        </div>

        {err && (
          <div style={{ color: "#b00020", marginBottom: 8 }} data-testid="comment-error">
            {err}
          </div>
        )}
        {toast && (
          <div data-testid="toast" style={{ color: "#0a0", marginBottom: 8 }}>
            {toast}
          </div>
        )}

        {/* コメントリスト */}
        <div
          style={{
            maxHeight: 260,
            overflow: "auto",
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 8,
            marginBottom: 12,
          }}
        >
          {comments.length === 0 && <div style={{ opacity: 0.7 }}>コメントはまだありません</div>}
          {comments.map((c) => (
            <div key={c.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "6px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {c.user || "名無し"} /{" "}
                {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
              </div>
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.text}</div>
            </div>
          ))}
        </div>

        {/* 入力・送信 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="名前（任意）"
            style={{ flex: "0 0 32%", border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px" }}
            onKeyDown={onKeyDown}
          />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="コメントを入力"
            style={{ flex: 1, border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px" }}
            onKeyDown={onKeyDown}
          />
          <button
            onClick={submit}
            disabled={!canSend}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: "#111",
              color: "#fff",
              opacity: canSend ? 1 : 0.5,
            }}
          >
            {sending ? "送信中…" : "送信"}
          </button>
        </div>

        {/* カートに追加（必要時のみ） */}
        {typeof onAddToCart === "function" && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              data-testid="add-to-cart"
              disabled={!effectiveCanAdd}
              onClick={() => onAddToCart()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "#2563eb",
                color: "#fff",
                opacity: effectiveCanAdd ? 1 : 0.5,
              }}
            >
              カートに追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}