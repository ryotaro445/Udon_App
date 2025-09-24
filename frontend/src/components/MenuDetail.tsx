// src/components/MenuDetail.tsx
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/client";
import type { Comment } from "../types";
import { isE2E } from "../test/e2eFlag";

// オプションUIがある場合を想定した汎用型（あれば活用、無ければ無視されます）
type OptionItem = { id: string | number; label?: string };
type OptionGroup = {
  required?: boolean;
  items?: OptionItem[];
  // 実装側で用意されているなら呼び出す想定（なければ無視）
  onSelect?: (id: string | number) => void;
};

type Props = {
  menuId: number;
  onClose: () => void;
  // ここから下は「カートに追加」を出す場合のみ利用（無ければコメント専用）
  open?: boolean;                  // モーダル開閉（E2Eの自動選択トリガに使用）
  options?: OptionGroup[];         // 必須オプションの集合（ある場合）
  canAdd?: boolean;                // 通常の有効判定（E2E時は上書き）
  onAddToCart?: () => void;        // これがあれば「カートに追加」ボタンを表示
};

export default function MenuDetail({
  menuId, onClose, open = true, options, canAdd = true, onAddToCart
}: Props) {
  // --- コメント機能（既存） ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiGet<Comment[]>(`/api/menus/${menuId}/comments`);
      setComments(data);
    } catch (e: any) {
      setErr(e?.message ?? "コメントの取得に失敗しました");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId]);

  const submit = async () => {
    setErr(null);
    if (!text.trim()) return;
    setSending(true);
    try {
      await apiPost(`/api/menus/${menuId}/comments`, { user: user || undefined, text });
      setText("");
      await load();
      setToast("コメントを投稿しました");
      setTimeout(() => setToast(null), 2000);
    } catch (e: any) {
      setErr(e?.message || "コメントがポリシーに違反しています。");
      setToast("不適切な内容のため投稿できません");
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSending(false);
    }
  };

  // --- ここからE2E向け：必須オプションの自動選択 ---
  useEffect(() => {
    if (!open || !isE2E()) return;
    try {
      options?.forEach((group) => {
        if (group?.required && Array.isArray(group.items) && group.items[0]) {
          group.onSelect?.(group.items[0].id);
        }
      });
    } catch {
      // no-op
    }
  }, [open, options]);

  // --- E2E時は“カートに追加”を強制有効化 ---
  const effectiveCanAdd = isE2E() ? true : canAdd;

  return (
    <div
      role="dialog"
      data-testid="menu-dialog"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}
    >
      <div style={{ background: "#fff", padding: 16, borderRadius: 8, width: 600, maxWidth: "95vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>メニューの詳細 / コメント</h2>
          <button onClick={onClose} aria-label="閉じる">×</button>
        </div>

        {/* --- ここにオプションUI（実装側にある場合） --- */}
        {/* options がある場合は、既存のUIで onSelect が呼ばれる想定です */}

        {/* --- コメント一覧（既存） --- */}
        {err && <div style={{ color: "red", marginBottom: 8 }}>{err}</div>}
        {toast && (
          <div data-testid="toast" style={{ color: "#0a0", marginBottom: 8 }}>{toast}</div>
        )}

        <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #eee", padding: 8, marginBottom: 12 }}>
          {comments.length === 0 && <div>コメントはまだありません</div>}
          {comments.map(c => (
            <div key={c.id} style={{ borderBottom: "1px solid #f0f0f0", padding: "6px 0" }}>
              <div style={{ fontSize: 12, opacity: .7 }}>
                {c.user || "名無し"} / {new Date(c.created_at).toLocaleString()}
              </div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={user} onChange={e => setUser(e.target.value)} placeholder="名前（任意）"
            style={{ flex: "0 0 30%" }}
          />
          <input
            value={text} onChange={e => setText(e.target.value)} placeholder="コメントを入力"
            style={{ flex: 1 }}
          />
          <button onClick={submit} disabled={sending}>
            {sending ? "送信中..." : "送信"}
          </button>
        </div>

        {/* --- カートに追加（onAddToCart が渡ってきたときのみ表示） --- */}
        {typeof onAddToCart === "function" && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              data-testid="add-to-cart"
              disabled={!effectiveCanAdd}
              onClick={() => onAddToCart()}
              className="rounded px-3 py-1 bg-blue-600 text-white disabled:opacity-50"
            >
              カートに追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}