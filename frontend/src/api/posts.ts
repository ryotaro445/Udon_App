// src/api/posts.ts
import { apiGet, apiPost, apiDelete } from "./client";
import type { Post } from "../types";

const STAFF_TOKEN = import.meta.env.VITE_STAFF_TOKEN as string | undefined;

const staffHeaders = STAFF_TOKEN ? { "X-Staff-Token": STAFF_TOKEN } : undefined;

export const fetchPosts = (limit = 50, category?: string) => {
  const q = new URLSearchParams({ limit: String(limit), ...(category ? { category } : {}) });
  return apiGet<Post[]>(`/api/posts?${q.toString()}`);
};

export const createPost = (p: { title: string; body: string; author: string; category?: string | null; pinned?: boolean }) =>
  apiPost<Post>("/api/posts", p, staffHeaders);   // ← ヘッダ付与

export const deletePost = (id: number) =>
  apiDelete<void>(`/api/posts/${id}`, staffHeaders);  // ← ヘッダ付与