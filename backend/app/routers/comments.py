from __future__ import annotations
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from ..database import get_db
from ..models import Menu, Comment

# ★ OpenAI モデレーション（既存: app/services/moderation.py）を利用
from app.services.moderation import get_moderation_client

import os, re

router = APIRouter(prefix="/api", tags=["comments"])

# --- 簡易NGワード（APIキー無い/失敗時の保険） ---
# 追加したい語は自由に増やしてください
_BLOCK_PATTERNS: List[re.Pattern] = [
    re.compile(r"\b(fuck|shit|bitch|bastard)\b", re.I),
    re.compile(r"(殺す|死ね|ころす|ぶっ殺|殺害)"),
]
def _passes_blocklist(text: str) -> bool:
    t = (text or "").strip()
    if not t:
        return False
    return not any(p.search(t) for p in _BLOCK_PATTERNS)

def _moderate_or_block(text: str) -> None:
    """
    1) OpenAI モデレーション（キーがあれば）
    2) キーが無い/障害時は NG ワードで判定
    NG なら HTTPException を投げて終了
    """
    mod = get_moderation_client()
    ok, reason = mod.check(text)   # services/moderation.py
    if mod.enabled:
        if not ok:
            # OpenAI によるブロック
            raise HTTPException(status_code=400, detail=reason or "blocked by moderation")
        return
    # キー未設定時: ブロックリストで判断
    if not _passes_blocklist(text):
        raise HTTPException(status_code=400, detail="blocked by blocklist")
    return

# ---------- POST ----------
@router.post("/menus/{menu_id}/comments", status_code=201)
def api_post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    user = (payload.get("user") or "").strip() or None
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")

    # ★ モデレーション（OpenAI or ブロックリスト）
    _moderate_or_block(text)

    c = Comment(menu_id=menu_id, user=user, text=text)
    db.add(c); db.commit(); db.refresh(c)

    return {
        "id": c.id,
        "menu_id": c.menu_id,
        "user": c.user,
        "text": c.text,
        "created_at": c.created_at.isoformat(),
    }

# ---------- GET ----------
@router.get("/menus/{menu_id}/comments")
def api_list_comments(menu_id: int, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    rows = (
        db.execute(select(Comment).where(Comment.menu_id == menu_id).order_by(desc(Comment.id)))
        .scalars()
        .all()
    )
    return [
        {"id": c.id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()}
        for c in rows
    ]