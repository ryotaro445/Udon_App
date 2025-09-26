from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ルーター
from app.routers import menus as menus_router
from app.routers import analytics as analytics_router
from app.routers import posts as posts_router 
from app.routers import comments as comments_router  

app = FastAPI()

# CORS（必要に応じてドメインを追加）
origins = [
    "http://localhost:5173",
    "https://udon-app.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /menus と /api/menus
app.include_router(menus_router.router)
app.include_router(menus_router.api_router)

# /api/analytics/*
app.include_router(analytics_router.router)

app.include_router(posts_router.router, prefix="/api")

app.include_router(comments_router.router)