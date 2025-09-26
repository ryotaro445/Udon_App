# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ルーターを“モジュール”として読み、変数名 router / api_router のどちらでも拾う
import app.routers.menus as menus
import app.routers.orders as orders
import app.routers.comments as comments
try:
    import app.routers.posts as posts
except Exception:
    posts = None
try:
    import app.routers.analytics as analytics
except Exception:
    analytics = None


def pick_router(mod):
    """module から APIRouter を取り出す（api_router 優先）"""
    if not mod:
        return None
    return getattr(mod, "api_router", getattr(mod, "router", None))


app = FastAPI(
    # 念のため明示しておく（/openapi.json が 404 になるのを防ぐ）
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS（Vercel / ローカル）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://udon-app.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def include_both(mod, tag: str):
    r = pick_router(mod)
    if r is None:
        print(f"[WARN] router not found for tag={tag}")
        return
    # /xxx と /api/xxx の両方を公開（移行期間の安全策）
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


@app.get("/healthz")
def healthz():
    return {"ok": True}