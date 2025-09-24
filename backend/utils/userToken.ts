// ランダムなユーザートークンを生成して localStorage に保存する
export function getUserToken(): string {
  const key = "user_token";
  let token = localStorage.getItem(key);
  if (!token) {
    token = Math.random().toString(36).slice(2); // 簡易ランダムID
    localStorage.setItem(key, token);
  }
  return token;
}