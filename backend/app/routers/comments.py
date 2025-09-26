# backend/app/routers/comments.py
from __future__ import annotations
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from ..database import get_db
from ..models import Menu, Comment
from app.services.moderation import get_moderation_client  # ← 追加
import logging

router = APIRouter(prefix="/api", tags=["comments"])
logger = logging.getLogger(__name__)

@router.post("/menus/{menu_id}/comments", status_code=201)
def api_post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    text = (payload.get("text") or "").strip()
    user = (payload.get("user") or "").strip() or None

    if not text:
        raise HTTPException(status_code=400, detail="empty text")

    # --- moderation check ---
    mod_client = get_moderation_client()
    allowed, reason = mod_client.check(text)
    if not allowed:
        # ブロック：クライアントに分かりやすく 400 を返す（必要なら 403 等へ変更）
        logger.info("comment blocked by moderation: menu=%s user=%s reason=%s", menu_id, user, reason)
        raise HTTPException(status_code=400, detail=f"blocked by moderation: {reason}")

    # 保存
    c = Comment(menu_id=menu_id, user=user, text=text)
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "menu_id": c.menu_id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()}

@router.get("/menus/{menu_id}/comments")
def api_list_comments(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    rows = db.execute(select(Comment).where(Comment.menu_id == menu_id).order_by(desc(Comment.id))).scalars().all()
    return [{"id": c.id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()} for c in rows]