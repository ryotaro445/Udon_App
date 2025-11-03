// frontend/src/api/likes.ts
import { apiGet, apiPost } from "./client";
import { getUserToken } from "../utils/userToken";

export const getLikes = (menuId: number) =>
  apiGet<{ count: number }>(`/api/menus/${menuId}/likes`);

export const addLike = (menuId: number) => {
  const token = getUserToken();
  return apiPost<{ new: boolean }>(`/api/menus/${menuId}/like`, undefined, {
    "x-user-token": token,
  });
};