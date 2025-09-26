# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ルーター
from app.routers import menus as menus_router
from app.routers import analytics as analytics_router

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

# /menus と /api/menus の両系統を公開
app.include_router(menus_router.router)       # /menus/*
app.include_router(menus_router.api_router)   # /api/menus/*

# /api/analytics/*
app.include_router(analytics_router.router)