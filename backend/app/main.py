# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# ルーター
from app.routers import menus as menus_router
from app.routers import analytics as analytics_router
from app.routers import posts as posts_router
from app.routers import comments as comments_router
from app.routers import likes as likes_router
from app.routers import orders as orders_router  # ★ 追加

app = FastAPI(title="Udon App API")

# --- CORS（必要に応じて調整）---
# 本番ドメインは明示。VercelのプレビューURLも許可したい場合は allow_origin_regex を利用。
ALLOW_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://udon-app.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app$",  # 例: プレビュー (xxx.vercel.app) を許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- APIレスポンスのキャッシュ無効化（最新在庫の取得を確実に）---
# /menus, /api/menus, /orders, /api/orders, /analytics 系に no-store を付与
API_NO_STORE_PREFIXES = ("/menus", "/api/menus", "/orders", "/api/orders", "/analytics")

@app.middleware("http")
async def add_no_store_header(request: Request, call_next):
    resp: Response = await call_next(request)
    if request.url.path.startswith(API_NO_STORE_PREFIXES):
        # 既に個別エンドポイントで設定していても上書きしないよう setdefault
        resp.headers.setdefault("Cache-Control", "no-store")
    return resp

# --- ルーター登録 ---
# /menus と /api/menus
app.include_router(menus_router.router)
app.include_router(menus_router.api_router)

# /api/analytics/*
app.include_router(analytics_router.router)

# /api/posts/*
app.include_router(posts_router.router, prefix="/api")

# /api/comments/* or /comments/*（comments_router側の定義に依存）
app.include_router(comments_router.router)

# /api/likes/*
app.include_router(likes_router.router, prefix="/api")

# ★ /orders と /api/orders を有効化
app.include_router(orders_router.router)       # /orders
app.include_router(orders_router.api_router)   # /api/orders

# ヘルスチェック（任意）
@app.get("/healthz")
def healthz():
    return {"ok": True}