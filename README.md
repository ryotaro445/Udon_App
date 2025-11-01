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
