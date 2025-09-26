// frontend/src/api/comments.ts
import { http } from "./http";

export type Comment = {
  id: number;
  user: string | null;
  text: string;
  created_at?: string;
};

export function fetchComments(menuId: number) {
  return http.get<Comment[]>(`/api/menus/${menuId}/comments`);
}

export function createComment(
  menuId: number,
  payload: { user?: string; text: string }
) {
  // Content-Type: application/json は http.ts 側で付与済み
  return http.post<Comment>(`/api/menus/${menuId}/comments`, payload);
}