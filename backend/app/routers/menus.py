from __future__ import annotations
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, asc, desc

from ..database import get_db
from ..models import Menu

# 2系統のルーター
router = APIRouter(tags=["menus"])                     # /menus/*
api_router = APIRouter(prefix="/api", tags=["menus"])  # /api/menus/*

# ---- helpers ----
def _order_clause(order: Optional[str]):
    if order in (None, "", "id", "+id"):
        return asc(Menu.id)
    if order == "-id":
        return desc(Menu.id)
    if order in ("price", "+price"):
        return asc(Menu.price)
    if order == "-price":
        return desc(Menu.price)
    return asc(Menu.id)

def _to_int(v, default=0):
    try:
        return int(v)
    except Exception:
        return default

def _model_dict(m: Menu) -> Dict[str, Any]:
    # 出力はスリム化（注文表示に必要な最小限）
    return {
        "id": m.id,
        "name": m.name,
        "price": m.price,
        "image": getattr(m, "image", None),
        # stock / in_stock は使わない（分析用で残す場合は追加可）
    }

# ---------- CRUD: /menus ----------
@router.get("/menus")
def list_menus(
    limit: int = 100,
    offset: int = 0,
    order: Optional[str] = None,
    db: Session = Depends(get_db),
):
    rows = (
        db.execute(select(Menu).order_by(_order_clause(order)).limit(limit).offset(offset))
        .scalars()
        .all()
    )
    return [_model_dict(m) for m in rows]

@router.post("/menus", status_code=201)
def create_menu(payload: Dict[str, Any], db: Session = Depends(get_db)):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name required")

    price = _to_int(payload.get("price"), 0)
    image = payload.get("image") or None

    m = Menu(name=name, price=price)
    if hasattr(m, "image"):
        m.image = image

    # スリム化：在庫系は受け付けない（無視）
    db.add(m)
    db.commit()
    db.refresh(m)
    return _model_dict(m)

@router.patch("/menus/{menu_id}")
def update_menu(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    m = db.get(Menu, menu_id)
    if not m:
        raise HTTPException(status_code=404, detail="menu not found")

    if "name" in payload and hasattr(m, "name"):
        m.name = (payload["name"] or "").strip()
    if "price" in payload and hasattr(m, "price"):
        m.price = _to_int(payload["price"], m.price)
    if "image" in payload and hasattr(m, "image"):
        m.image = payload["image"] or None

    # スリム化：在庫/in_stock は更新しない
    db.commit()
    db.refresh(m)
    return _model_dict(m)

@router.delete("/menus/{menu_id}")
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    m = db.get(Menu, menu_id)
    if not m:
        raise HTTPException(status_code=404, detail="menu not found")
    db.delete(m)
    db.commit()
    return {"ok": True}

# ---------- CRUD: /api/menus ----------
@api_router.get("/menus")
def api_list_menus(db: Session = Depends(get_db)):
    rows = db.execute(select(Menu).order_by(asc(Menu.id))).scalars().all()
    return [_model_dict(m) for m in rows]

@api_router.post("/menus", status_code=201)
def api_create_menu(payload: Dict[str, Any], db: Session = Depends(get_db)):
    return create_menu(payload, db)

@api_router.patch("/menus/{menu_id}")
def api_update_menu(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    return update_menu(menu_id, payload, db)

@api_router.delete("/menus/{menu_id}")
def api_delete_menu(menu_id: int, db: Session = Depends(get_db)):
    return delete_menu(menu_id, db)