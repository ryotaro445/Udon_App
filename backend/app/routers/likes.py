# backend/app/routers/likes.py
from __future__ import annotations
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app.models import Menu, MenuLike

router = APIRouter()

@router.get("/menus/{menu_id}/likes")
def get_like_count(menu_id: int, db: Session = Depends(get_db)):
    """メニューの合計いいね数"""
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    count = db.scalar(
        select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
    ) or 0
    return {"count": int(count)}

@router.get("/menus/{menu_id}/like/me")
def get_my_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    """自分がそのメニューをいいね済みか"""
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    if not x_user_token:
        raise HTTPException(status_code=400, detail="X-User-Token required")

    exists = db.scalar(
        select(MenuLike.id).where(
            MenuLike.menu_id == menu_id, MenuLike.user_token == x_user_token
        )
    )
    return {"liked": bool(exists)}

@router.post("/menus/{menu_id}/like")
def post_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    """いいね（idempotent）"""
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
        # 既に押していたら状態は据え置き（idempotent）
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

@router.delete("/menus/{menu_id}/like")
def delete_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    """いいね取り消し（idempotent）"""
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    if not x_user_token:
        raise HTTPException(status_code=400, detail="X-User-Token required")

    row = db.scalar(
        select(MenuLike).where(
            MenuLike.menu_id == menu_id, MenuLike.user_token == x_user_token
        )
    )
    if row:
        db.delete(row)
        db.commit()

    count = db.scalar(
        select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id)
    ) or 0
    return {"deleted": bool(row), "count": int(count)}