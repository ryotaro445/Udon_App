from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from ..database import get_db
from ..models import Menu, Order, OrderItem
import os

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# --- 追加: スタッフ認証（X-Staff-Token ヘッダ必須） ---
def require_staff(x_staff_token: str | None = Header(None, alias="X-Staff-Token")):
    expected = os.environ.get("STAFF_TOKEN") or os.environ.get("STAFF_PASSWORD")
    if not expected:
        # 運用の明確化のため、未設定なら閉じる
        raise HTTPException(status_code=503, detail="staff token not configured")
    if not x_staff_token or x_staff_token != expected:
        raise HTTPException(status_code=401, detail="staff only")
    return True

@router.get("/top-menus")
def top_menus(
    limit: int = 10,
    days: int = 30,
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),   # ★ 追加
):
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