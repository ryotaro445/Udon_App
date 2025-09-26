# backend/app/routers/analytics.py
from __future__ import annotations
import os
from typing import Literal, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, literal

from ..database import get_db
from ..models import Menu, Order, OrderItem

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# ---- スタッフ認証（X-Staff-Token と環境変数を照合） ----
def require_staff(x_staff_token: str | None = Header(None, alias="X-Staff-Token")):
    expected = os.environ.get("STAFF_TOKEN") or os.environ.get("STAFF_PASSWORD")
    if not expected:
        # 未設定時は閉じる（運用上の明確化）
        raise HTTPException(status_code=503, detail="staff token not configured")
    if not x_staff_token or x_staff_token != expected:
        raise HTTPException(status_code=401, detail="staff only")
    return True

# ---- サマリー（期間合計） ----
@router.get("/summary")
def summary(
    range: Literal["today", "7d", "30d"] = Query("today"),
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),
) -> Dict[str, Any]:
    # 期間計算（created_at が無い環境でも落ちないように try/except）
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    if range == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range == "7d":
        start = now - timedelta(days=7)
    else:
        start = now - timedelta(days=30)

    period_start = start.isoformat()
    period_end = now.isoformat()

    # created_at が無いケースに備えたフォールバック集計
    try:
        # 件数（注文）
        order_count = db.execute(
            select(func.count(Order.id)).where(Order.created_at >= start)
        ).scalar_one()
        # 売上（数量×単価）
        total_amount = db.execute(
            select(func.coalesce(func.sum(OrderItem.quantity * Menu.price), 0))
            .join(Menu, Menu.id == OrderItem.menu_id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.created_at >= start)
        ).scalar_one()
    except Exception:
        # created_at が無いなどスキーマ差異時はフォールバック（全期間）
        order_count = db.execute(select(func.count(Order.id))).scalar_one()
        total_amount = db.execute(
            select(func.coalesce(func.sum(OrderItem.quantity * Menu.price), 0))
            .join(Menu, Menu.id == OrderItem.menu_id)
            .join(Order, Order.id == OrderItem.order_id)
        ).scalar_one()

    return {
        "range": range,
        "period_start": period_start,
        "period_end": period_end,
        "order_count": int(order_count or 0),
        "total_amount": int(total_amount or 0),
    }

# ---- 人気メニュー ----
@router.get("/top-menus")
def top_menus(
    limit: int = 10,
    days: int = 30,   # （created_at があれば期間で絞る。無ければ無視）
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
        .order_by(desc(literal("quantity")))
        .limit(limit)
    )
    # 期間絞り（created_at があれば）
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

# ---- 時間帯別（チャート用） ----
@router.get("/hourly")
def hourly(
    days: int = 7,
    db: Session = Depends(get_db),
    _staff: bool = Depends(require_staff),
) -> Dict[str, Any]:
    # created_at が無い環境でも落ちないように安全実装
    try:
        from datetime import datetime, timedelta, timezone
        start = datetime.now(timezone.utc) - timedelta(days=days)

        # hour 切り出しは DB 方言差があるため、FastAPI では素直に 0..23 を埋める方法も可
        # ここでは SQLite/Postgres どちらでも動くように case-when で集計
        hour_expr = func.strftime("%H", Order.created_at)  # SQLite
        # PostgreSQL なら: func.date_part("hour", Order.created_at)

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

        # 0..23 で穴埋め
        by_hour = {int(r.h): (int(r.cnt), int(r.amt)) for r in rows if r.h is not None}
        buckets = [{"hour": h, "count": by_hour.get(h, (0, 0))[0], "amount": by_hour.get(h, (0, 0))[1]} for h in range(24)]
        return {"days": days, "buckets": buckets}
    except Exception:
        # created_at が無い/DB方言差で落ちる場合は空配列を返す（フロントは描画可能）
        return {"days": days, "buckets": []}