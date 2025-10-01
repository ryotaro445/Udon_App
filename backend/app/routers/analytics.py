# backend/app/routers/analytics.py
from __future__ import annotations
import os
from typing import Literal, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, text

from ..database import get_db
from ..models import Menu, Order, OrderItem

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# ---- スタッフ認証（X-Staff-Token と環境変数を照合） ----
def require_staff(x_staff_token: str | None = Header(None, alias="X-Staff-Token")):
    expected = os.environ.get("STAFF_TOKEN") or os.environ.get("STAFF_PASSWORD")
    if not expected:
        raise HTTPException(status_code=503, detail="staff token not configured")
    if not x_staff_token or x_staff_token != expected:
        raise HTTPException(status_code=401, detail="staff only")
    return True

# ---- サマリー ----
@router.get("/summary")
def summary(
    range: Literal["today", "7d", "30d"] = Query("today"),
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),
) -> Dict[str, Any]:
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    if range == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range == "7d":
        start = now - timedelta(days=7)
    else:
        start = now - timedelta(days=30)

    try:
        order_count = db.execute(
            select(func.count(Order.id)).where(Order.created_at >= start)
        ).scalar_one()
        total_amount = db.execute(
            select(func.coalesce(func.sum(OrderItem.quantity * Menu.price), 0))
            .join(Menu, Menu.id == OrderItem.menu_id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.created_at >= start)
        ).scalar_one()
    except Exception:
        order_count = db.execute(select(func.count(Order.id))).scalar_one()
        total_amount = db.execute(
            select(func.coalesce(func.sum(OrderItem.quantity * Menu.price), 0))
            .join(Menu, Menu.id == OrderItem.menu_id)
            .join(Order, Order.id == OrderItem.order_id)
        ).scalar_one()

    return {
        "range": range,
        "period_start": start.isoformat(),
        "period_end": now.isoformat(),
        "order_count": int(order_count or 0),
        "total_amount": int(total_amount or 0),
    }

# ---- 人気メニュー ----
@router.get("/top-menus")
def top_menus(
    limit: int = 10,
    days: int = 30,
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),
) -> List[Dict[str, Any]]:
    q = (
        select(
            OrderItem.menu_id.label("menu_id"),
            Menu.name.label("name"),
            func.sum(OrderItem.quantity).label("quantity"),
            func.sum(OrderItem.quantity * Menu.price).label("amount"),
        )
        .join(Menu, Menu.id == OrderItem.menu_id)
        .join(Order, Order.id == OrderItem.order_id)
        .group_by(OrderItem.menu_id, Menu.name)
        .order_by(desc(func.sum(OrderItem.quantity)))
        .limit(limit)
    )
    try:
        from datetime import datetime, timedelta, timezone
        start = datetime.now(timezone.utc) - timedelta(days=days)
        q = q.where(Order.created_at >= start)  # type: ignore[attr-defined]
    except Exception:
        pass

    rows = db.execute(q).all()
    return [
        {
            "menu_id": r.menu_id,
            "name": r.name,
            "quantity": int(r.quantity or 0),
            "amount": int(r.amount or 0),
        }
        for r in rows
    ]

# ---- 時間帯別 ----
@router.get("/hourly")
def hourly(
    days: int = 7,
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),
) -> Dict[str, Any]:
    try:
        from datetime import datetime, timedelta, timezone
        start = datetime.now(timezone.utc) - timedelta(days=days)
        hour_expr = func.strftime("%H", Order.created_at)  # SQLite
        rows = db.execute(
            select(
                hour_expr.label("h"),
                func.count(Order.id).label("cnt"),
                func.coalesce(func.sum(OrderItem.quantity * Menu.price), 0).label("amt"),
            )
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Menu, Menu.id == OrderItem.menu_id)
            .where(Order.created_at >= start)
            .group_by("h")
            .order_by("h")
        ).all()
        by_hour = {int(r.h): (int(r.cnt), int(r.amt)) for r in rows if r.h is not None}
        buckets = [{"hour": h, "count": by_hour.get(h, (0, 0))[0], "amount": by_hour.get(h, (0, 0))[1]} for h in range(24)]
        return {"days": days, "buckets": buckets}
    except Exception:
        return {"days": days, "buckets": []}

# ---- 日別売上（★ 追加）----
@router.get("/daily-sales")
def daily_sales(
    days: int = 14,
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),
):
    """
    直近days日の日別売上金額（と注文件数）
    [{"date": "2025-09-20", "sales": 12000, "orders": 5}, ...]
    """
    if days <= 0 or days > 180:
        raise HTTPException(status_code=400, detail="invalid days")

    # OrderItem × Menu.price で合計。Order.created_at で日付集計。
    rows = db.execute(text("""
        SELECT DATE(o.created_at) AS d,
               COALESCE(SUM(oi.quantity * m.price), 0) AS sales,
               COUNT(DISTINCT o.id) AS orders
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN menus m        ON m.id = oi.menu_id
        WHERE o.created_at >= DATETIME('now', '-' || :days || ' days')
        GROUP BY DATE(o.created_at)
        ORDER BY d ASC
    """), {"days": days}).fetchall()

    return [{"date": r[0], "sales": int(r[1] or 0), "orders": int(r[2] or 0)} for r in rows]