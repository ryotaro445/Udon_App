# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ルーターをモジュールとして import（中の変数名は router / api_router どちらでも拾う）
import app.routers.menus as menus
import app.routers.orders as orders
import app.routers.comments as comments
try:
    import app.routers.posts as posts
except ImportError:
    posts = None
try:
    import app.routers.analytics as analytics
except ImportError:
    analytics = None

def pick_router(mod):
    return getattr(mod, "api_router", getattr(mod, "router", None)) if mod else None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://udon-app.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def include_both(mod, tag):
    r = pick_router(mod)
    if r is None:
        print(f"[WARN] router not found for tag={tag}")
        return
    # /menus, /orders ... と /api/menus ... を両方公開
    app.include_router(r, tags=[tag])                 # 例: /menus
    app.include_router(r, prefix="/api", tags=[tag])  # 例: /api/menus

include_both(menus, "menus")
include_both(orders, "orders")
include_both(comments, "comments")
include_both(posts, "posts")
include_both(analytics, "analytics")

@app.get("/")
def root():
    return {"status": "ok"}