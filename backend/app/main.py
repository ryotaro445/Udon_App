from fastapi import FastAPI
from app.routers import menus, orders, analytics, comments
from .routers import test_reset as test_reset_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# /menus 系
app.include_router(menus.router, tags=["menus"])
# /api/menus 系
app.include_router(menus.api_router, tags=["menus"])

# /orders 系
app.include_router(orders.router, tags=["orders"])
# /api/orders
app.include_router(orders.api_router, tags=["orders"])

# /api/comments（board moderation 用）
app.include_router(comments.router, tags=["comments"])

# /api/analytics
app.include_router(analytics.router, tags=["analytics"])

# /app/routers/test_reset_router
app.include_router(test_reset_router.router)




origins = [
    "http://localhost:5173",
    "https://*.vercel.app",
]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"ok": True}
