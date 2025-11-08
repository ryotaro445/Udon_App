# backend/app/api/routes/forecast.py
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db  # ここは今動いている形のままでOK

# 既存どおり2つルーターを定義しておく
router = APIRouter(prefix="/forecasts", tags=["forecast"])
analytics = APIRouter(prefix="/api/analytics", tags=["analytics"])


@analytics.get("/forecast")
def get_forecast(
    menu_id: str = Query("all"),
    days: int = Query(7),
    db: Session = Depends(get_db),
):
    # ここはまだダミーのまま（必要になったら実装）
    return {"menu_id": menu_id, "days": days, "data": []}


@analytics.get("/heatmap")
def get_heatmap(
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
    params: dict[str, object] = {"start": start, "end": end}
    base_join = ""

    if menu_id != "all":
        base_join = " AND oi.menu_id = :menu_id"
        params["menu_id"] = int(menu_id)

    # PostgreSQL 用のクエリ
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