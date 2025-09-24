import { apiGet, apiPost } from "./client";
import { getUserToken } from "../utils/userToken";

// いいね数を取得
export const getLikes = (menuId: number) =>
  apiGet<{ count: number }>(`/api/menus/${menuId}/likes`);

// いいねを追加
export const addLike = (menuId: number) => {
  const token = getUserToken();
  return apiPost<{ new: boolean }>(`/api/menus/${menuId}/like`, undefined, {
    "x-user-token": token,
  });
};