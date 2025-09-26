# 🍜 Udon App

＜概要＞

	•	メニュー表示・注文
	•	いいね機能
	•	コメント機能（⚡ OpenAI Moderation による不適切ワードブロック対応）
	•	掲示板機能
	•	従業員ダッシュボード（在庫管理・売上分析）
	•	Swagger UI による API 確認

  

＜使用技術＞
  • Backend: FastAPI, SQLAlchemy, SQLite
	•	Frontend: React (Vite, TypeScript), Recharts, Tailwind CSS
	•	Infra / Deploy: Render (Backend), Vercel (Frontend)
	•	Test: pytest, Playwright, Vitest

  
＜デモURL＞
- **フロントエンド**: https://udon-app.vercel.app  
- **バックエンド(API)**: https://udon-app.onrender.com  
- **Swagger (APIドキュメント)**: https://udon-app.onrender.com/docs  


＜進捗＞
- バックエンド・フロントエンド共にデプロイ済み
- 注文フロー・分析機能は動作確認済み
- コメント機能に AI モデレーションを導入
- 掲示板機能は追加実装済み
- テストは API 単体テストまで完了、E2E は一部未完成
- いいね機能　テスト未完了


＜セットアップ手順＞

### 1. リポジトリをクローン
```bash
git clone https://github.com/yourname/Udon_App.git
cd Udon_App



