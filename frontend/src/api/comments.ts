// frontend/src/api/comments.ts
import { getJSON, apiPost } from "./client";

export type Comment = { id: number; user: string | null; text: string };

// 共通: フォールバック GET
async function getWithFallback<T>(p1: string, p2: string): Promise<T> {
  try {
    return await getJSON<T>(p1);
  } catch {
    return await getJSON<T>(p2);
  }
}

// 共通: フォールバック POST
async function postWithFallback<T>(p1: string, p2: string, body: any): Promise<T> {
  try {
    return await apiPost<T>(p1, body);
  } catch {
    return await apiPost<T>(p2, body);
  }
}

export function fetchComments(menuId: number) {
  // /menus/:id/comments → 失敗したら /api/menus/:id/comments
  return getWithFallback<Comment[]>(
    `/menus/${menuId}/comments`,
    `/api/menus/${menuId}/comments`
  );
}

export function createComment(menuId: number, payload: { user?: string; text: string }) {
  // /menus/:id/comments → 失敗したら /api/menus/:id/comments
  return postWithFallback<Comment>(
    `/menus/${menuId}/comments`,
    `/api/menus/${menuId}/comments`,
    payload
  );
}