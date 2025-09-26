// frontend/src/api/posts.ts
import { getJSON, apiPost, apiDelete } from "./client";
import type { Post } from "../types";

const STAFF_TOKEN = import.meta.env.VITE_STAFF_TOKEN as string | undefined;
const staffHeaders = STAFF_TOKEN ? { "X-Staff-Token": STAFF_TOKEN } : undefined;

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
    return await apiPost<T>(p1, body, staffHeaders);
  } catch {
    return await apiPost<T>(p2, body, staffHeaders);
  }
}

// 共通: フォールバック DELETE
async function deleteWithFallback<T>(p1: string, p2: string): Promise<T> {
  try {
    return await apiDelete<T>(p1, staffHeaders);
  } catch {
    return await apiDelete<T>(p2, staffHeaders);
  }
}

export async function fetchPosts(limit = 50, category?: string) {
  const q = new URLSearchParams({ limit: String(limit) });
  if (category) q.set("category", category);

  // /posts → 失敗したら /api/posts
  return await getWithFallback<Post[]>(`/posts?${q}`, `/api/posts?${q}`);
}

export function createPost(p: {
  title: string;
  body: string;
  author: string;
  category?: string | null;
  pinned?: boolean;
}) {
  // /posts → 失敗したら /api/posts
  return postWithFallback<Post>("/posts", "/api/posts", p);
}

export function deletePost(id: number) {
  const path1 = `/posts/${id}`;
  const path2 = `/api/posts/${id}`;
  return deleteWithFallback<void>(path1, path2);
}