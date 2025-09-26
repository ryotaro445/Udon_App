# 🍜 Udon App

## 概要
- メニュー表示・注文
- いいね機能
- コメント機能（⚡ OpenAI Moderation による不適切ワードブロック対応）
- 掲示板機能
- 従業員ダッシュボード（在庫管理・売上分析）
- Swagger UI による API 確認

## 使用技術
- Backend: FastAPI, SQLAlchemy, SQLite
- Frontend: React (Vite, TypeScript), Recharts, Tailwind CSS
- Infra / Deploy: Render (Backend), Vercel (Frontend)
- Test: pytest, Playwright, Vitest

## デモURL
- **フロントエンド**: https://udon-app.vercel.app  
- **バックエンド(API)**: https://udon-app.onrender.com  
- **Swagger (APIドキュメント)**: https://udon-app.onrender.com/docs
  

---

## ✅ 完了済み
### 機能
- メニュー表示・注文フロー（QRコードから商品選択～注文確定まで）
- いいね機能（API 側、二重カウント防止済み）
- コメント機能（⚡ AI Moderation 導入済み）
- 掲示板機能（投稿 / 削除 / ピン留め）
- 従業員モード（ログイン → メニュー編集 / 在庫・価格変更反映）
- 売上分析（時間帯別 / 日別グラフ）
- Swagger UI（自動生成 API ドキュメント）

### テスト
- バックエンド（pytest）: メニュー取得 / 注文作成 / コメント投稿
- フロント（Vitest/RTL）: ModeSelect / ProtectedRoute
- E2E（Playwright）: 顧客ハッピーパス（1品注文 → 完了）

### デプロイ
- Backend → Render  
- Frontend → Vercel  
- デモ URL 発行済み

---

## ⏳ 残タスク（優先度高のみ）
- **モード切替改善**：再読み込みを挟まずに SPA 内で切替可能にする  
- **AI Moderation 安定化**：429（Too Many Requests）発生時のリトライ処理を追加
- いいね機能テスト

---

## 起動方法（ローカル開発用）

### Backend
```bash
cd backend
uvicorn app.main:app --reload


### Frontend
cd frontend
npm install
npm run dev



セットアップ手順
git clone https://github.com/yourname/Udon_App.git
cd Udon_App
