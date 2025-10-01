from __future__ import annotations
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models import Menu, MenuLike   

router = APIRouter()

@router.get("/menus/{menu_id}/likes")
def get_like_count(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    count = db.scalar(
        select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
    ) or 0
    return {"count": int(count)}

@router.post("/menus/{menu_id}/like")
def post_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    if not x_user_token:
        raise HTTPException(status_code=400, detail="X-User-Token required")

    exists = db.scalar(
        select(MenuLike.id).where(
            MenuLike.menu_id == menu_id, MenuLike.user_token == x_user_token
        )
    )
    if exists:
        count = db.scalar(
            select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
        ) or 0
        return {"new": False, "count": int(count)}

    db.add(MenuLike(menu_id=menu_id, user_token=x_user_token))
    db.commit()
    count = db.scalar(
        select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
    ) or 0
    return {"new": True, "count": int(count)}