// frontend/src/api/comments.ts
import { http } from "./http";

export type Comment = {
  id: number;
  user: string | null;
  text: string;
  created_at?: string;
};

/** モデレーション系のエラー文面をユーザー向けに整形 */
function normalizeModerationError(raw: unknown): Error {
  const msg = String((raw as any)?.message ?? (raw as any)?.detail ?? raw ?? "");

  if (/NGワード/.test(msg)) {
    return new Error(msg); // ← サーバーからの NG ワード詳細をそのまま表示
  }
  if (/moderation disabled/i.test(msg)) {
    return new Error("現在、モデレーション機能が無効のため投稿できません。（管理者に連絡してください）");
  }
  if (/blocked by moderation/i.test(msg) || /unsafe/i.test(msg) || /policy/i.test(msg)) {
    return new Error("不適切な内容が含まれている可能性があります。表現を見直してください。");
  }
  if (/empty text/i.test(msg)) {
    return new Error("コメントが空です。内容を入力してください。");
  }
  return new Error(msg || "コメントの送信に失敗しました。");
}

export function fetchComments(menuId: number) {
  return http.get<Comment[]>(`/api/menus/${menuId}/comments`);
}

export async function createComment(
  menuId: number,
  payload: { user?: string; text: string }
): Promise<Comment> {
  try {
    return await http.post<Comment>(`/api/menus/${menuId}/comments`, payload);
  } catch (e) {
    throw normalizeModerationError(e);
  }
}