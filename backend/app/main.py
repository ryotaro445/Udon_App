from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ルーターをインポート
from app.routers import menus, orders, analytics, comments

app = FastAPI()

# --- CORS設定 ---
origins = [
    "http://localhost:5173",
    "https://udon-app.vercel.app",   # ← Vercel フロントの本番URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 本番はこのドメインだけ
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- include_routerでまとめる ---
app.include_router(menus.router, tags=["menus"])
app.include_router(orders.router, tags=["orders"])
app.include_router(comments.router, tags=["comments"])
app.include_router(analytics.router, tags=["analytics"])