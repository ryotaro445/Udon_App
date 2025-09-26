from __future__ import annotations
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import select, asc, desc, func
from ..database import get_db
from ..models import Menu, Comment, MenuLike
import os, re

router = APIRouter(tags=["menus"])
api_router = APIRouter(prefix="/api", tags=["menus"])

# …（中略：GET/POST/PATCH/DELETE・likes など既存のまま）…

def _validate_comment(text: Optional[str]): 
    return bool(text and text.strip())

# --- 追加: モデレーション ---
BAD_WORDS = [
    r"\bfuck\b", r"\bshit\b", r"\basshole\b", r"\bdie\b",
    r"死ね", r"殺す", r"ぶっ殺", r"バカ", r"くそ", r"氏ね",
]
def _simple_block(text: str) -> bool:
    t = text.lower()
    return any(re.search(pat, t) for pat in BAD_WORDS)

def _ai_block(text: str) -> bool:
    if not os.environ.get("OPENAI_API_KEY"):
        return _simple_block(text)
    try:
        from openai import OpenAI
        client = OpenAI()
        res = client.moderations.create(model="omni-moderation-latest", input=text)
        return bool(res.results[0].flagged)
    except Exception:
        # APIエラー時は簡易判定にフォールバック
        return _simple_block(text)

@router.post("/menus/{menu_id}/comments", status_code=201)
def post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")
    user = (payload.get("user") or "").strip() or None
    text = (payload.get("text") or "").strip()
    if not _validate_comment(text):
        raise HTTPException(status_code=400, detail="empty text")

    # ★ 追加: AIモデレーション/NGワード
    if _ai_block(text):
        raise HTTPException(status_code=400, detail="comment rejected by moderation")

    c = Comment(menu_id=menu_id, user=user, text=text)
    db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "menu_id": c.menu_id, "user": c.user, "text": c.text, "created_at": c.created_at.isoformat()}