// src/api/posts.ts
import { apiGet, apiPost, apiDelete } from "./client";

export type Post = {
  id: number;
  title: string;
  body: string;
  author: string;
  createdAt?: string;           // ISO文字列
  pinned?: boolean | null;
  category?: string | null;
};

const STAFF_TOKEN = import.meta.env.VITE_STAFF_TOKEN as string | undefined;
const staffHeaders = STAFF_TOKEN ? { "X-Staff-Token": STAFF_TOKEN } : undefined;

export const fetchPosts = (limit = 50, category?: string) =>
  apiGet<Post[]>(
    `/api/posts?${new URLSearchParams({
      limit: String(limit),
      ...(category ? { category } : {}),
    }).toString()}`
  );

export const createPost = (p: {
  title: string;
  body: string;
  author: string;
  category?: string | null;
  pinned?: boolean;
}) => apiPost<Post>("/api/posts", p, staffHeaders);

export const deletePost = (id: number) =>
  apiDelete<void>(`/api/posts/${id}`, staffHeaders);

// ピン留め切替（サーバは POST /posts/:id/pin を受け付ける）
export const setPinned = (id: number, pinned: boolean) =>
  apiPost<{ ok: boolean; pinned: boolean }>(
    `/api/posts/${id}/pin`,
    { pinned },
    staffHeaders
  );