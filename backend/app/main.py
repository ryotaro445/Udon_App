# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# モジュールとして import（中の変数名が router / api_router どちらでもOKにする）
import app.routers.menus as menus
import app.routers.orders as orders
import app.routers.comments as comments
# 掲示板があるなら:
try:
    import app.routers.posts as posts
except ImportError:
    posts = None
# 分析があるなら:
try:
    import app.routers.analytics as analytics
except ImportError:
    analytics = None

def pick_router(mod):
    """module から APIRouter を取り出す（api_router 優先）"""
    if mod is None:
        return None
    return getattr(mod, "api_router", getattr(mod, "router", None))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://udon-app.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def include(name, mod, tag):
    r = pick_router(mod)
    if r is not None:
        app.include_router(r, prefix="/api", tags=[tag])
    else:
        # 見つからない場合はログに残す（本番では print でも十分）
        print(f"[WARN] Router not found in {name} (looking for api_router or router)")

include("menus", menus, "menus")
include("orders", orders, "orders")
include("comments", comments, "comments")
include("posts", posts, "posts")
include("analytics", analytics, "analytics")

@app.get("/")
def root():
    return {"status": "ok"}