# backend/app/routers/analytics.py
from __future__ import annotations

from typing import Literal, List, Dict, Any
from datetime import date  # 👈 追加

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, text

from ..database import get_db
from ..models import Menu, Order, OrderItem
from .deps import require_staff  # ✅ 共通のスタッフ認証を使用


router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    dependencies=[Depends(require_staff)],  # ✅ このルーター配下は全てスタッフ限定
)


@router.get("/summary")
def summary(
    range: Literal["today", "7d", "30d"] = Query("today"),
    db: Session = Depends(get_db),
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
        # created_at が NULL などでエラーになった場合のフォールバック
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


@router.get("/top-menus")
def top_menus(
    limit: int = 10,
    days: int = 30,
    db: Session = Depends(get_db),
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

    # 期間フィルタ（PostgreSQL 用）
    if days > 0:
        from datetime import datetime, timedelta, timezone

        start = datetime.now(timezone.utc) - timedelta(days=days)
        q = q.where(Order.created_at >= start)  # type: ignore[attr-defined]

    rows = db.execute(q).all()
    return [
        {
            "menu_id": r.menu_id,
            "name": r.name,
            # 互換キー（テストは count または qty を期待）
            "count": int((r.quantity or 0)),
            "qty": int((r.quantity or 0)),
            # 既存キーも維持
            "quantity": int((r.quantity or 0)),
            "amount": int((r.amount or 0)),
        }
        for r in rows
    ]


@router.get("/hourly")
def hourly(
    days: int = 7,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    直近 days 日の時間帯別分布（全メニュー）
    """
    try:
        from datetime import datetime, timedelta, timezone

        start = datetime.now(timezone.utc) - timedelta(days=days)

        # PostgreSQL 用: created_at から「時」を抽出
        hour_expr = func.extract("hour", Order.created_at)

        rows = db.execute(
            select(
                hour_expr.label("h"),
                func.count(Order.id).label("cnt"),
                func.coalesce(
                    func.sum(OrderItem.quantity * Menu.price), 0
                ).label("amt"),
            )
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Menu, Menu.id == OrderItem.menu_id)
            .where(Order.created_at >= start)
            .group_by("h")
            .order_by("h")
        ).all()

        by_hour = {
            int(r.h): (int(r.cnt), int(r.amt)) for r in rows if r.h is not None
        }
        buckets = [
            {
                "hour": h,
                "count": by_hour.get(h, (0, 0))[0],
                "amount": by_hour.get(h, (0, 0))[1],
            }
            for h in range(24)
        ]
        return {"days": days, "buckets": buckets}
    except Exception:
        # DB エラー時は空配列を返す
        return {"days": days, "buckets": []}


@router.get("/daily-sales")
def daily_sales(
    days: int = 14,
    db: Session = Depends(get_db),
):
    """
    直近 days 日の日別売上金額＆注文件数（PostgreSQL版）
    """
    if days <= 0 or days > 180:
        raise HTTPException(status_code=400, detail="invalid days")

    rows = db.execute(
        text(
            """
            SELECT
                DATE(o.created_at) AS d,
                COALESCE(SUM(oi.quantity * m.price), 0) AS sales,
                COUNT(DISTINCT o.id) AS orders
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN menus m        ON m.id = oi.menu_id
            WHERE o.created_at >= (NOW() - (:days || ' days')::interval)
            GROUP BY DATE(o.created_at)
            ORDER BY d ASC;
            """
        ),
        {"days": days},
    ).fetchall()

    return [
        {"date": r[0], "sales": int(r[1] or 0), "orders": int(r[2] or 0)}
        for r in rows
    ]


# ===== ここからメニュー別 =====

@router.get("/menu-totals")
def menu_totals(
    days: int = 30,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    直近 days 日のメニュー別 合計（注文件数・売上金額）
    days <= 0 なら全期間
    """
    q = (
        select(
            OrderItem.menu_id.label("menu_id"),
            Menu.name.label("name"),
            func.sum(OrderItem.quantity).label("orders"),
            func.sum(OrderItem.quantity * Menu.price).label("sales"),
        )
        .join(Menu, Menu.id == OrderItem.menu_id)
        .join(Order, Order.id == OrderItem.order_id)
        .group_by(OrderItem.menu_id, Menu.name)
        .order_by(desc(func.sum(OrderItem.quantity)))
        .limit(limit)
    )

    if days > 0:
        from datetime import datetime, timedelta, timezone

        start = datetime.now(timezone.utc) - timedelta(days=days)
        q = q.where(Order.created_at >= start)  # type: ignore[attr-defined]

    rows = db.execute(q).all()
    return [
        {
            "menu_id": r.menu_id,
            "name": r.name,
            "orders": int(r.orders or 0),
            "sales": int(r.sales or 0),
        }
        for r in rows
    ]


@router.get("/menu-daily")
def menu_daily(
    menu_id: int = Query(..., description="対象メニューID"),
    days: int = 14,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    直近 days 日の 指定メニュー の日別（件数・売上）
    PostgreSQL 版
    """
    if days <= 0 or days > 180:
        raise HTTPException(status_code=400, detail="invalid days")

    rows = db.execute(
        text(
            """
            SELECT
                DATE(o.created_at) AS d,
                COALESCE(SUM(oi.quantity), 0)           AS orders,
                COALESCE(SUM(oi.quantity * m.price), 0) AS sales
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN menus m        ON m.id = oi.menu_id
            WHERE oi.menu_id = :menu_id
              AND o.created_at >= (NOW() - (:days || ' days')::interval)
            GROUP BY DATE(o.created_at)
            ORDER BY d ASC;
            """
        ),
        {"menu_id": menu_id, "days": days},
    ).fetchall()

    return [
        {"date": r[0], "orders": int(r[1] or 0), "sales": int(r[2] or 0)}
        for r in rows
    ]


@router.get("/menu-hourly")
def menu_hourly(
    menu_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    直近 days 日の 指定メニュー の時間別（0-23時）件数・売上
    PostgreSQL 版
    """
    try:
        from datetime import datetime, timedelta, timezone

        start = datetime.now(timezone.utc) - timedelta(days=days)
        hour_expr = func.extract("hour", Order.created_at)

        rows = db.execute(
            select(
                hour_expr.label("h"),
                func.coalesce(
                    func.sum(OrderItem.quantity), 0
                ).label("cnt"),
                func.coalesce(
                    func.sum(OrderItem.quantity * Menu.price), 0
                ).label("amt"),
            )
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Menu, Menu.id == OrderItem.menu_id)
            .where(Order.created_at >= start)
            .where(OrderItem.menu_id == menu_id)
            .group_by("h")
            .order_by("h")
        ).all()

        by_hour = {
            int(r.h): (int(r.cnt), int(r.amt)) for r in rows if r.h is not None
        }
        buckets = [
            {
                "hour": h,
                "orders": by_hour.get(h, (0, 0))[0],
                "amount": by_hour.get(h, (0, 0))[1],
            }
            for h in range(24)
        ]
        return {"menu_id": menu_id, "days": days, "buckets": buckets}
    except Exception:
        return {"menu_id": menu_id, "days": days, "buckets": []}


# ===== ここから需要予測 =====

@router.get("/forecast")
def forecast(
    menu_id: str = Query("all", description="メニューID または 'all'"),
    days: int = Query(7, ge=1, le=31, description="何日先まで予測するか"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    需要予測：
    - 過去の売上を日別に集計
    - 曜日ごとの平均売上を求める
    - それを使って未来 days 日分の売上金額を予測する
    """

    # 1) 日別売上を集計（orders.status = 'served' のみ対象）
    base_sql = """
        SELECT
            DATE(o.created_at) AS d,
            COALESCE(SUM(oi.quantity * m.price), 0) AS sales
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN menus m        ON m.id = oi.menu_id
        WHERE o.status = 'served'
    """

    params: Dict[str, Any] = {}
    if menu_id != "all":
        # 数字以外が来た場合は空データ
        if not menu_id.isdigit():
            return {"menu_id": menu_id, "days": days, "data": []}
        base_sql += " AND oi.menu_id = :menu_id"
        params["menu_id"] = int(menu_id)

    base_sql += """
        GROUP BY DATE(o.created_at)
        ORDER BY d ASC;
    """

    rows = db.execute(text(base_sql), params).fetchall()
    if not rows:
        return {"menu_id": menu_id, "days": days, "data": []}

    # Python 側で日別データに整形
    from datetime import timedelta

    daily: List[tuple] = []
    for r in rows:
        d = r[0]      # date
        sales = int(r[1] or 0)
        daily.append((d, sales))

    # 2) 曜日ごとの平均売上
    weekday_values: Dict[int, List[int]] = {i: [] for i in range(7)}
    for d, sales in daily:
        weekday_values[d.weekday()].append(sales)

    def avg(lst: List[int]) -> float:
        return float(sum(lst)) / len(lst) if lst else 0.0

    weekday_avg: Dict[int, float] = {w: avg(v) for w, v in weekday_values.items()}
    global_avg: float = avg([s for _, s in daily])

    # 3) 未来 days 日分を予測
    last_date = daily[-1][0]
    forecast_data: List[Dict[str, Any]] = []

    for i in range(1, days + 1):
        target_date = last_date + timedelta(days=i)
        w = target_date.weekday()
        base = weekday_avg.get(w) or global_avg or 0.0
        forecast_data.append(
            {
                "date": target_date.isoformat(),
                "y": int(round(base)),  # 予測売上金額
            }
        )

    return {
        "menu_id": menu_id,
        "days": days,
        "data": forecast_data,
    }


# ===== ヒートマップ =====

@router.get("/heatmap")
def heatmap(
    menu_id: str = Query("all"),
    start: date = Query(..., description="YYYY-MM-DD"),
    end: date = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    曜日×時間帯ヒートマップ用データ（PostgreSQL版）
    - dow: 0=Sun ... 6=Sat
    - hour: 0〜23
    - y: 数量
    """
    params: Dict[str, object] = {"start": start, "end": end}
    base_join = ""

    if menu_id != "all":
        base_join = " AND oi.menu_id = :menu_id"
        params["menu_id"] = int(menu_id)

    sql = text(
        f"""
        SELECT
          EXTRACT(DOW FROM o.created_at AT TIME ZONE 'Asia/Tokyo')::int  AS dow,
          EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Tokyo')::int AS hour,
          SUM(oi.quantity) AS y
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE (o.created_at AT TIME ZONE 'Asia/Tokyo')::date
              BETWEEN :start AND :end
        {base_join}
        GROUP BY 1, 2
        ORDER BY 1, 2
        """
    )

    rows = db.execute(sql, params).mappings().all()
    data = [
        {
            "dow": int(r["dow"]),
            "hour": int(r["hour"]),
            "y": int(r["y"] or 0),
        }
        for r in rows
    ]
    # フロントが期待している形式
    return {"data": data}