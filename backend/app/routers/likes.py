from __future__ import annotations
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from ..database import get_db
from ..models import Menu, MenuLike

router = APIRouter(tags=["likes"])                 # /menus/*
api_router = APIRouter(prefix="/api", tags=["likes"])  # /api/menus/*

# ---- helpers ----
def _ensure_menu(menu_id: int, db: Session):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

def _count_likes(menu_id: int, db: Session) -> int:
    return int(
        db.scalar(select(func.count()).select_from(MenuLike).where(MenuLike.menu_id == menu_id))
        or 0
    )

# ---------- GET count ----------
@router.get("/menus/{menu_id}/likes")
def get_like_count(menu_id: int, db: Session = Depends(get_db)):
    _ensure_menu(menu_id, db)
    return {"count": _count_likes(menu_id, db)}

@api_router.get("/menus/{menu_id}/likes")
def api_get_like_count(menu_id: int, db: Session = Depends(get_db)):
    return get_like_count(menu_id, db)

# ---------- GET my like ----------
@router.get("/menus/{menu_id}/like/me")
def get_my_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    _ensure_menu(menu_id, db)
    if not x_user_token:
        raise HTTPException(status_code=400, detail="X-User-Token required")
    exists = db.scalar(
        select(MenuLike.id).where(
            MenuLike.menu_id == menu_id, MenuLike.user_token == x_user_token
        )
    )
    return {"liked": bool(exists)}

@api_router.get("/menus/{menu_id}/like/me")
def api_get_my_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    return get_my_like(menu_id, db, x_user_token)

# ---------- POST like（冪等） ----------
@router.post("/menus/{menu_id}/like")
def post_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    """
    いいね（idempotent）。同じユーザーが同じメニューに再度POSTしても 200 を返し、countは増えない。
    レスポンス: {"new": bool, "count": int}
    """
    _ensure_menu(menu_id, db)
    if not x_user_token:
        raise HTTPException(status_code=400, detail="X-User-Token required")

    exists = db.scalar(
        select(MenuLike.id).where(
            MenuLike.menu_id == menu_id, MenuLike.user_token == x_user_token
        )
    )
    if exists:
        return {"new": False, "count": _count_likes(menu_id, db)}

    db.add(MenuLike(menu_id=menu_id, user_token=x_user_token))
    db.commit()
    return {"new": True, "count": _count_likes(menu_id, db)}

@api_router.post("/menus/{menu_id}/like")
def api_post_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    return post_like(menu_id, db, x_user_token)

# ---------- DELETE like（冪等） ----------
@router.delete("/menus/{menu_id}/like")
def delete_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    """
    いいね取り消し（idempotent）。既に無くても 200。
    レスポンス: {"deleted": bool, "count": int}
    """
    _ensure_menu(menu_id, db)
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
    return {"deleted": bool(row), "count": _count_likes(menu_id, db)}

@api_router.delete("/menus/{menu_id}/like")
def api_delete_like(
    menu_id: int,
    db: Session = Depends(get_db),
    x_user_token: str | None = Header(default=None, alias="X-User-Token"),
):
    return delete_like(menu_id, db, x_user_token)