from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ★ それぞれ “実際に使われている” ルーターの名前で import する
from app.routers.menus import api_router as menus_router       # 例: api_router だった場合
from app.routers.orders import router as orders_router         # 例: router だった場合
from app.routers.comments import router as comments_router
from app.routers.posts import router as posts_router           # 無ければ削除
from app.routers.analytics import router as analytics_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://udon-app.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ★ /api に統一
app.include_router(menus_router,     prefix="/api", tags=["menus"])
app.include_router(orders_router,    prefix="/api", tags=["orders"])
app.include_router(comments_router,  prefix="/api", tags=["comments"])
app.include_router(posts_router,     prefix="/api", tags=["posts"])        # 無ければ削除
app.include_router(analytics_router, prefix="/api", tags=["analytics"])

@app.get("/")
def root():
    return {"status": "ok"}