# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ルーターをまとめて import
from .routers import menus, orders, comments, likes, analytics

app = FastAPI()

# ✅ CORS をここで一度だけ設定
origins = [
    "http://localhost:5173",            # ローカル開発用
    "https://udon-app.vercel.app",      # 本番フロント
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ ルーターを直接 include_router（prefix で /api をつける）
app.include_router(menus.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(likes.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok"}