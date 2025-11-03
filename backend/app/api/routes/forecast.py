# backend/app/api/routes/forecast.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/forecasts", tags=["forecast"])
analytics = APIRouter(prefix="/api/analytics", tags=["analytics"])

@analytics.get("/forecast")
def get_forecast(
    menu_id: str = Query("all"),
    days: int = Query(7),
    db: Session = Depends(get_db),
):
    # ここはダミーの枠だけ（必要に応じて実装）
    return {"menu_id": menu_id, "days": days, "data": []}

@analytics.get("/heatmap")
def get_heatmap(
    menu_id: str = Query("all"),
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    params = {"start": start, "end": end}
    base_join = " AND oi.menu_id = :menu_id" if menu_id != "all" else ""
    if menu_id != "all":
        params["menu_id"] = int(menu_id)

    # order_items からのみ集計（orders の quantity などは参照しない）
    sql = text(
        f"""
        SELECT
          CAST(STRFTIME('%w', o.created_at) AS INT) AS dow,
          CAST(STRFTIME('%H', o.created_at) AS INT) AS hour,
          SUM(oi.quantity) AS y
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE DATE(o.created_at) BETWEEN :start AND :end
        {base_join}
        GROUP BY 1, 2
        ORDER BY 1, 2
        """
    )
    # mappings() で dict 形式にしてアクセスを安定化
    rows = db.execute(sql, params).mappings().all()
    data = [{"dow": r["dow"], "hour": r["hour"], "y": int(r["y"] or 0)} for r in rows]
    return {"data": data}  # ★ テスト期待形式