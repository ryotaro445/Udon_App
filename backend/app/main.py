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
from app.routers import orders as orders_router  

app = FastAPI(title="Udon App API")

# --- CORS ---
ALLOW_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://udon-app.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app$",  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- APIレスポンスのキャッシュ無効化 ---
API_NO_STORE_PREFIXES = (
    "/menus",
    "/api/menus",
    "/orders",
    "/api/orders",
    "/analytics",
    "/api/analytics",  
)

@app.middleware("http")
async def add_no_store_header(request: Request, call_next):
    resp: Response = await call_next(request)
    if request.url.path.startswith(API_NO_STORE_PREFIXES):
        resp.headers.setdefault("Cache-Control", "no-store")
    return resp

# --- ルーター登録 ---
app.include_router(menus_router.router)
app.include_router(menus_router.api_router)
app.include_router(analytics_router.router)          # /api/analytics/*
app.include_router(posts_router.router, prefix="/api")
app.include_router(comments_router.router)
app.include_router(likes_router.router, prefix="/api")
app.include_router(orders_router.router)             # /orders
app.include_router(orders_router.api_router)         # /api/orders

@app.get("/healthz")
def healthz():
    return {"ok": True}