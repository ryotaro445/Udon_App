# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# ルーター
from app.routers import menus as menus_router
from app.routers import orders as orders_router
from app.routers import analytics as analytics_router

from app.database import Base, engine, SessionLocal
from app.models import Menu, Order, OrderItem

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
# メニュー
app.include_router(menus_router.router)       # /menus/*
app.include_router(menus_router.api_router)   # /api/menus/*

# 注文
app.include_router(orders_router.router)      # /orders/*
app.include_router(orders_router.api_router)  # /api/orders/*

# アナリティクス（売上・予測ふくむ）
app.include_router(analytics_router.router)   # /api/analytics/*


def _bootstrap_seed() -> None:
    """テスト/ローカル起動時の最小シード。メニュー3件＋検証用の注文を1件。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # メニュー3件が無ければ投入
        mcount = db.query(Menu).count()
        if mcount == 0:
            menus = [
                Menu(name="かけうどん",   price=390, stock=50),
                Menu(name="きつねうどん", price=520, stock=30),
                Menu(name="カレーうどん", price=680, stock=20),
            ]
            db.add_all(menus)
            db.commit()

        # placed 注文が無ければ： menu1 x2(390), menu3 x1(680) → 合計 1460
        has_placed = db.query(Order).filter(Order.status == "placed").first()
        if not has_placed:
            m1 = db.query(Menu).filter(Menu.name == "かけうどん").first()
            m3 = db.query(Menu).filter(Menu.name == "カレーうどん").first()
            if m1 and m3:
                o = Order(status="placed")
                db.add(o)
                db.flush()
                items = [
                    OrderItem(order_id=o.id, menu_id=m1.id, price=m1.price, quantity=2),
                    OrderItem(order_id=o.id, menu_id=m3.id, price=m3.price, quantity=1),
                ]
                db.add_all(items)
                db.commit()
    finally:
        db.close()


@app.on_event("startup")
def _startup():
    _bootstrap_seed()


@app.get("/healthz")
def healthz():
    return {"ok": True}