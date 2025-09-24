from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from ..database import get_db
from ..models import Menu, Order, OrderItem

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/top-menus")
def top_menus(limit: int = 10, days: int = 30, db: Session = Depends(get_db)):
    # created_at が無くても動く集計（最近 days はここでは未使用）
    q = (
        select(
            Menu.name.label("name"),
            OrderItem.menu_id.label("menu_id"),
            func.sum(OrderItem.quantity).label("qty"),
        )
        .join(Menu, Menu.id == OrderItem.menu_id)
        .join(Order, Order.id == OrderItem.order_id)
        .group_by(OrderItem.menu_id, Menu.name)
        .order_by(desc("qty"))
        .limit(limit)
    )
    rows = db.execute(q).all()
    return [{"menu_id": r.menu_id, "name": r.name, "qty": int(r.qty)} for r in rows]