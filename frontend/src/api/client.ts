// frontend/src/api/client.ts
// 旧api（apiGet/apiPost/apiPatch/apiDelete）を http.* に橋渡し
import { http } from "./http";

type H = HeadersInit | undefined;

export const apiGet =  <T>(path: string, headers?: H) =>
  http.get<T>(path, headers ? { headers } : undefined);

export const apiPost = <T>(path: string, body?: unknown, headers?: H) =>
  http.post<T>(path, body, headers ? { headers } : undefined);

export const apiPatch = <T>(path: string, body?: unknown, headers?: H) =>
  http.patch<T>(path, body, headers ? { headers } : undefined);

export const apiDelete = <T>(path: string, headers?: H) =>
  http.del<T>(path, headers ? { headers } : undefined);