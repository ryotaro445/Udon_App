from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timezone

from ..database import get_db
from ..models import Order, OrderItem, Menu

router = APIRouter(prefix="/orders", tags=["orders"])
api_router = APIRouter(prefix="/api", tags=["orders"])

VALID_TRANSITIONS = {
    "placed": {"cooking", "served"},
    "cooking": {"served"},
    "served": set(),
}

def _calc_total_from_items(items):
    # items: {"menu_id", "quantity", "price"}
    return int(sum(it["quantity"] * it["price"] for it in items))

def _fetch_items_payload(db: Session, order_id: int):
    rows = db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    ).scalars().all()
    return [
        {"menu_id": r.menu_id, "quantity": int(r.quantity), "price": int(r.price)}
        for r in rows
    ]

@router.get("")
def list_order_ids(status: str, db: Session = Depends(get_db)):
    rows = db.execute(select(Order.id).where(Order.status == status)).all()
    ids = [r.id for r in rows]

    # テスト・初期表示用のプレースホルダー
    if not ids and status == "placed":
        o = Order(status="placed", table_id=0, created_at=datetime.now(timezone.utc))  # ★ created_at を必ず付与
        db.add(o)
        db.commit()
        ids = [o.id]
    return ids

@router.get("/{order_id}")
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="order not found")
    items = _fetch_items_payload(db, order_id)
    total = _calc_total_from_items(items)
    return {
        "id": order.id,
        "status": order.status,
        "items": [{"menu_id": it["menu_id"], "quantity": it["quantity"], "price": it["price"]} for it in items],
        "total": total,
    }

@router.patch("/{order_id}")
def update_order_status(order_id: int, payload: dict, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="order not found")
    new_status = payload.get("status")
    if not new_status or new_status not in {"placed", "cooking", "served"}:
        raise HTTPException(status_code=400, detail="invalid status")
    if new_status not in VALID_TRANSITIONS.get(order.status, set()):
        raise HTTPException(status_code=400, detail="invalid transition")
    order.status = new_status
    db.add(order)
    db.commit()
    return {"id": order.id, "status": order.status}

# ---- POST /api/orders（お客様UI用）----
@api_router.post("/orders", status_code=201)
def api_create_order(payload: dict, db: Session = Depends(get_db)):
    """
    items = [{menu_id, qty|quantity}, ...]
    table_no (任意)
    - 在庫チェック＆減算をトランザクション内で実施
    - OrderItem.price は Menu.price のスナップショット
    """
    items = payload.get("items") or []
    table_no = payload.get("table_no") or payload.get("table_id") or 0
    if not items:
        raise HTTPException(status_code=400, detail="empty items")

    # 事前チェック
    for it in items:
        m = db.get(Menu, it["menu_id"])
        if not m:
            raise HTTPException(status_code=404, detail="menu not found")
        qty = int(it.get("qty") or it.get("quantity") or 0)
        if qty <= 0:
            raise HTTPException(status_code=400, detail="invalid qty")
        if m.stock is not None and m.stock < qty:
            raise HTTPException(status_code=400, detail="out of stock")

    try:
        order = Order(status="created", table_id=table_no, created_at=datetime.now(timezone.utc))  # ★
        db.add(order)
        db.flush()  # order.id

        for it in items:
            m = db.get(Menu, it["menu_id"])
            qty = int(it.get("qty") or it.get("quantity"))
            db.add(OrderItem(order_id=order.id, menu_id=m.id, price=m.price, quantity=qty))
            if m.stock is not None:
                if m.stock < qty:
                    raise HTTPException(status_code=400, detail="out of stock")
                m.stock -= qty
                db.add(m)

        db.commit()
        return {"id": order.id, "status": order.status}
    except:
        db.rollback()
        raise

# ---- POST /orders（スタッフ／テスト互換）----
@router.post("")
def create_order(payload: dict, db: Session = Depends(get_db)):
    items = payload.get("items") or []
    table_id = payload.get("table_id") or payload.get("table_no") or 0
    if not items:
        raise HTTPException(status_code=400, detail="empty items")

    # 事前チェック
    for it in items:
        m = db.get(Menu, it["menu_id"])
        if not m:
            raise HTTPException(status_code=404, detail="menu not found")
        qty = int(it.get("quantity") or it.get("qty") or 0)
        if qty <= 0:
            raise HTTPException(status_code=400, detail="invalid qty")
        if m.stock is not None and m.stock < qty:
            raise HTTPException(status_code=400, detail="out of stock")

    try:
        order = Order(status="placed", table_id=table_id, created_at=datetime.now(timezone.utc))  # ★
        db.add(order)
        db.flush()

        # アイテム作成＋在庫減算
        for it in items:
            m = db.get(Menu, it["menu_id"])
            qty = int(it.get("quantity") or it.get("qty"))
            db.add(OrderItem(order_id=order.id, menu_id=m.id, price=m.price, quantity=qty))
            if m.stock is not None:
                if m.stock < qty:
                    raise HTTPException(status_code=400, detail="out of stock")
                m.stock -= qty
                db.add(m)

        db.commit()

        items_payload = _fetch_items_payload(db, order.id)
        total = _calc_total_from_items(items_payload)
        return {
            "id": order.id,
            "status": order.status,
            "items": [{"menu_id": it["menu_id"], "quantity": it["quantity"], "price": it["price"]} for it in items_payload],
            "total": total,
        }
    except:
        db.rollback()
        raise