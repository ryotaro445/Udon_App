# app/routers/menu_comments.py
from __future__ import annotations
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.util.payload import extract_comment_text
from app.services.moderation import get_moderation_client
from ..database import get_db
from ..models import Menu, Comment

router = APIRouter(prefix="/api/menus", tags=["comments"])


class CommentIn(BaseModel):
    # 受信時は複数キーを許容するが、OpenAPI的には body を正として提示
    author: Optional[str] = Field(default=None, max_length=50)
    body: str = Field(..., min_length=1, max_length=500)


class CommentOut(BaseModel):
    id: int
    menu_id: int
    author: Optional[str]
    text: str
    created_at: datetime


@router.post("/{menu_id}/comments", status_code=201, response_model=CommentOut, summary="Post Comment")
def api_post_comment(
    menu_id: int = Path(..., ge=1),
    payload: dict = ...,
    db: Session = Depends(get_db),
):
    # Menu 存在確認
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    # 入力取得（author は任意）
    author = (payload.get("author") or "").strip() or None
    text = extract_comment_text(payload)  # body/text/comment/message を吸収

    # AI モデレーション（ローカル→AI→フェイルオープン）
    allowed, reason = get_moderation_client().check(text)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason)

    # 保存
    c = Comment(menu_id=menu_id, user=author, text=text)
    db.add(c)
    db.commit()
    db.refresh(c)

    return CommentOut(
        id=c.id,
        menu_id=c.menu_id,
        author=c.user,
        text=c.text,
        created_at=c.created_at,
    )


@router.get("/{menu_id}/comments", response_model=List[CommentOut], summary="List Comments")
def api_list_comments(
    menu_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    rows = db.execute(
        select(Comment).where(Comment.menu_id == menu_id).order_by(desc(Comment.id))
    ).scalars().all()

    return [
        CommentOut(
            id=c.id,
            menu_id=c.menu_id,
            author=c.user,
            text=c.text,
            created_at=c.created_at,
        )
        for c in rows
    ]