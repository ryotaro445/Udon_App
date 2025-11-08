# backend/app/schemas.py
from typing import List, Optional
from pydantic import BaseModel, Field

# ---------- /api/orders 用 ----------
class ApiOrderItemIn(BaseModel):
    menu_id: int
    qty: int = Field(ge=1)

class ApiOrderCreate(BaseModel):
    table_no: int
    items: List[ApiOrderItemIn]

# ---------- /orders 用 ----------
class OrderItemIn(BaseModel):
    menu_id: int
    quantity: int = Field(ge=1)

class OrderCreate(BaseModel):
    table_id: int
    items: List[OrderItemIn]

# ---------- レスポンス（注文） ----------
class OrderItemOut(BaseModel):
    menu_id: int
    price: int
    quantity: int

class OrderOut(BaseModel):
    id: int
    status: str
    table_id: Optional[int] = None
    table_no: Optional[int] = None
    total: int
    items: List[OrderItemOut]

# ---------- 予測/ヒートマップ（/api/analytics/*） ----------
class ForecastPoint(BaseModel):
    menu_id: int
    ds: str            # YYYY-MM-DD
    yhat: float
    yhat_lo: float
    yhat_hi: float

class HeatmapCell(BaseModel):
    dow: int           # 0=Sun .. 6=Sat
    hour: int          # 0..23
    y: float

class ForecastResponse(BaseModel):
    data: List[ForecastPoint]

class HeatmapResponse(BaseModel):
    data: List[HeatmapCell]