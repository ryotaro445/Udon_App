# 🍜 Udon App

## 概要

Udon App は、メニューの注文データから **需要予測** と  
**曜日 × 時間帯ヒートマップ** を可視化する分析用ダッシュボードです。

- 過去の注文履歴にもとづく **メニュー別・日別の予測杯数**
- 曜日 × 時間帯ごとの **混雑状況ヒートマップ**
- 売上・注文数の **時系列トレンド**

などをブラウザ上から確認でき、仕込み量の調整やオペレーション改善に役立てることを想定しています。

---

## 主な機能

- 📈 メニュー別の日次需要予測グラフ
- 🗺 曜日 × 時間帯ごとの注文数ヒートマップ
- 📊 期間を指定した売上・杯数の集計
- 🔍 メニュー／日付レンジの絞り込み表示
- 🧪 API・フロントエンドの自動テスト

---

## 使用技術

- **Backend**
  - FastAPI
  - SQLAlchemy
  - PostgreSQL（本番／Render）
  - Alembic（マイグレーション）

- **Frontend**
  - React (Vite, TypeScript)
  - Recharts（グラフ描画）
  - Tailwind CSS

- **Infra / Deploy**
  - Render（Backend/API）
  - Vercel（Frontend）

- **Test**
  - pytest（バックエンド）
  - Playwright / Vitest（フロントエンド）

---

## デモURL

- **フロントエンド**: https://udon-app.vercel.app  
- **バックエンド(API)**: https://udon-app.onrender.com  
- **Swagger (APIドキュメント)**: https://udon-app.onrender.com/docs  

---

## 起動方法（ローカル開発）

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourname/Udon_App.git
cd Udon_App
