# backend/app/routers/comments.py
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import Dict, Any

from ..database import get_db
from ..models import Menu, Comment
from app.services.moderation import get_moderation_client

router = APIRouter(prefix="/api", tags=["comments"])

@router.post("/menus/{menu_id}/comments", status_code=201)
def api_post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    user = (payload.get("user") or "").strip() or None
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")

    # === AI モデレーション ===
    ok, reason = get_moderation_client().check(text)
    if not ok:
        # 400で返却（フロントはこのメッセージを表示）
        raise HTTPException(status_code=400, detail=reason or "blocked by moderation")

    c = Comment(menu_id=menu_id, user=user, text=text)
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "menu_id": c.menu_id,
        "user": c.user,
        "text": c.text,
        "created_at": c.created_at.isoformat(),
    }

@router.get("/menus/{menu_id}/comments")
def api_list_comments(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    rows = db.execute(
        select(Comment).where(Comment.menu_id == menu_id).order_by(desc(Comment.id))
    ).scalars().all()
    return [
        {"id": c.id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()}
        for c in rows
    ]