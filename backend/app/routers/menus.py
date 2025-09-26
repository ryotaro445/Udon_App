from __future__ import annotations
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select, asc, desc, func

from ..database import get_db
from ..models import Menu, Comment, MenuLike

router = APIRouter(tags=["menus"])                    # /menus
api_router = APIRouter(prefix="/api", tags=["menus"]) # /api/menus

# ---- helpers ----
def _order_clause(order: Optional[str]):
    if order in (None, "", "id", "+id"): return asc(Menu.id)
    if order == "-id": return desc(Menu.id)
    if order in ("price", "+price"): return asc(Menu.price)
    if order == "-price": return desc(Menu.price)
    return asc(Menu.id)

def _to_int(v, default=0):
    try: return int(v)
    except Exception: return default

def _bool_from_payload(payload: Dict[str, Any]) -> Optional[bool]:
    # stock(数) → in_stock(bool) へブリッジ
    if "in_stock" in payload: return bool(payload["in_stock"])
    if "stock" in payload: return _to_int(payload["stock"], 0) > 0
    return None

def _model_dict(m: Menu) -> Dict[str, Any]:
    return {
        "id": m.id,
        "name": m.name,
        "price": m.price,
        "stock": getattr(m, "stock", None),
        "in_stock": getattr(m, "in_stock", None),
        "image": getattr(m, "image", None),
    }

# ---------- GET ----------
@router.get("/menus")
def list_menus(limit: int = 100, offset: int = 0, order: Optional[str] = None, db: Session = Depends(get_db)):
    rows = db.execute(select(Menu).order_by(_order_clause(order)).limit(limit).offset(offset)).scalars().all()
    return [_model_dict(m) for m in rows]

@api_router.get("/menus")
def api_list_menus(db: Session = Depends(get_db)):
    rows = db.execute(select(Menu).order_by(asc(Menu.id))).scalars().all()
    return [_model_dict(m) for m in rows]

# ---------- POST ----------
def _create_menu_common(payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name required")
    price = _to_int(payload.get("price"), 0)
    image = (payload.get("image") or None)
    in_stock = _bool_from_payload(payload)
    stock = payload.get("stock", None)

    m = Menu(name=name, price=price)
    if hasattr(m, "image"): m.image = image
    if hasattr(m, "stock") and stock is not None: m.stock = _to_int(stock, 0)
    if hasattr(m, "in_stock") and in_stock is not None: m.in_stock = bool(in_stock)

    db.add(m)
    db.commit()
    db.refresh(m)
    return _model_dict(m)

@router.post("/menus", status_code=201)
def create_menu(payload: Dict[str, Any], db: Session = Depends(get_db)):
    return _create_menu_common(payload, db)

@api_router.post("/menus", status_code=201)
def api_create_menu(payload: Dict[str, Any], db: Session = Depends(get_db)):
    return _create_menu_common(payload, db)

# ---------- PATCH ----------
def _update_menu_common(menu_id: int, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    m = db.get(Menu, menu_id)
    if not m:
        raise HTTPException(status_code=404, detail="menu not found")

    if "name" in payload and hasattr(m, "name"):
        m.name = (payload["name"] or "").strip()
    if "price" in payload and hasattr(m, "price"):
        m.price = _to_int(payload["price"], getattr(m, "price", 0))
    if "image" in payload and hasattr(m, "image"):
        m.image = payload["image"] or None

    if hasattr(m, "stock") and "stock" in payload:
        m.stock = _to_int(payload["stock"], getattr(m, "stock", 0))
    if hasattr(m, "in_stock"):
        b = _bool_from_payload(payload)
        if b is not None:
            m.in_stock = bool(b)

    db.commit()
    db.refresh(m)
    return _model_dict(m)

@router.patch("/menus/{menu_id}")
def update_menu(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    return _update_menu_common(menu_id, payload, db)

@api_router.patch("/menus/{menu_id}")
def api_update_menu(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    return _update_menu_common(menu_id, payload, db)

# ---------- DELETE ----------
def _delete_menu_common(menu_id: int, db: Session) -> Dict[str, Any]:
    m = db.get(Menu, menu_id)
    if not m:
        raise HTTPException(status_code=404, detail="menu not found")
    db.delete(m)
    db.commit()
    return {"ok": True}

@router.delete("/menus/{menu_id}")
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    return _delete_menu_common(menu_id, db)

@api_router.delete("/menus/{menu_id}")
def api_delete_menu(menu_id: int, db: Session = Depends(get_db)):
    return _delete_menu_common(menu_id, db)

# ---------- likes / comments（既存そのまま） ----------
@router.post("/menus/{menu_id}/like")
def like_menu(menu_id: int, db: Session = Depends(get_db), x_user_token: Optional[str] = Header(None, alias="X-User-Token")):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    if not x_user_token:
        raise HTTPException(status_code=400, detail="X-User-Token required")

    exists = db.execute(
        select(MenuLike).where(MenuLike.menu_id == menu_id, MenuLike.user_token == x_user_token)
    ).scalar_one_or_none()

    new = False
    if not exists:
        db.add(MenuLike(menu_id=menu_id, user_token=x_user_token))
        db.commit()
        new = True

    cnt = db.execute(select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)).scalar_one()
    return {"new": new, "count": int(cnt)}

@router.get("/menus/{menu_id}/likes")
def get_likes(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    cnt = db.execute(select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)).scalar_one()
    return {"count": int(cnt)}

def _validate_comment(text: Optional[str]): return bool(text and text.strip())

@router.post("/menus/{menu_id}/comments", status_code=201)
def post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    user = (payload.get("user") or "").strip() or None
    text = payload.get("text")
    if not _validate_comment(text):
        raise HTTPException(status_code=400, detail="empty text")
    c = Comment(menu_id=menu_id, user=user, text=text.strip())
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "menu_id": c.menu_id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()}

@router.get("/menus/{menu_id}/comments")
def list_comments(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    rows = db.execute(select(Comment).where(Comment.menu_id == menu_id).order_by(desc(Comment.id))).scalars().all()
    return [{"id": c.id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()} for c in rows]