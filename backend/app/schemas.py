# app/schemas.py
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


# ---------- レスポンス ----------
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