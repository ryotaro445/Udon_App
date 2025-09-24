from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select, asc, desc, func

from ..database import get_db
from ..models import Menu, Comment, MenuLike

router = APIRouter(tags=["menus"])                 # /menus 系
api_router = APIRouter(prefix="/api", tags=["menus"])  # /api/menus 系

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

@router.get("/menus")
def list_menus(limit: int = 10, offset: int = 0, order: Optional[str] = None, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Menu).order_by(_order_clause(order)).limit(limit).offset(offset)
    ).scalars().all()
    return [{"id": m.id, "name": m.name, "price": m.price, "stock": m.stock} for m in rows]

@api_router.get("/menus")
def api_list_menus(db: Session = Depends(get_db)):
    rows = db.execute(select(Menu).order_by(asc(Menu.id))).scalars().all()
    return [{"id": m.id, "name": m.name, "price": m.price, "stock": m.stock} for m in rows]

# ---- likes ----
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

    cnt = db.execute(
        select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
    ).scalar_one()
    return {"new": new, "count": int(cnt)}

@router.get("/menus/{menu_id}/likes")
def get_likes(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    cnt = db.execute(
        select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
    ).scalar_one()
    return {"count": int(cnt)}

# ---- comments (/menus) ----
def _validate_comment(text: Optional[str]):
    return bool(text and text.strip())

@router.post("/menus/{menu_id}/comments", status_code=201)
def post_comment(menu_id: int, payload: dict, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    user = (payload.get("user") or "").strip() or None
    text = payload.get("text")
    if not _validate_comment(text):
        raise HTTPException(status_code=400, detail="empty text")
    c = Comment(menu_id=menu_id, user=user, text=text.strip())
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "menu_id": c.menu_id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()}

@router.get("/menus/{menu_id}/comments")
def list_comments(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    rows = db.execute(
        select(Comment).where(Comment.menu_id == menu_id).order_by(desc(Comment.id))
    ).scalars().all()
    return [{"id": c.id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()} for c in rows]