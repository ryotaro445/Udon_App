from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# あるものだけ import（無いものは消す）
from app.routers import menus, orders, comments, posts, analytics

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://udon-app.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ★ 全ルーターを /api で公開
app.include_router(menus.router,     prefix="/api", tags=["menus"])
app.include_router(orders.router,    prefix="/api", tags=["orders"])
app.include_router(comments.router,  prefix="/api", tags=["comments"])
app.include_router(posts.router,     prefix="/api", tags=["posts"])        # 掲示板が無ければ削除
app.include_router(analytics.router, prefix="/api", tags=["analytics"])

@app.get("/")
def root():
    return {"status": "ok"}