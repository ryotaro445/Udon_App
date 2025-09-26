# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ★ 各ルーターを必ず import
from app.routers import menus as menus_router
from app.routers import analytics as analytics_router  # ある場合

app = FastAPI()

# ★ CORS：本番フロントとローカルを許可
origins = [
    "http://localhost:5173",
    "https://udon-app.vercel.app",  # ← Vercel の本番URLに合わせる
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ★ ここが肝：/menus と /api/menus の“両方”をマウント
app.include_router(menus_router.router)       # /menus 系（GET/POST/PATCH/DELETE）
app.include_router(menus_router.api_router)   # /api/menus 系（GET/POST/PATCH/DELETE）

# ★ analytics を使っているなら必ずマウント
app.include_router(analytics_router.router)   # /api/analytics/*