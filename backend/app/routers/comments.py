from __future__ import annotations
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.database import get_db
from app.models import Menu, Comment

router = APIRouter()
api_router = APIRouter(prefix="/api")

def _get_menu_or_404(db: Session, menu_id: int) -> Menu:
    m = db.get(Menu, menu_id)
    if not m:
        raise HTTPException(status_code=404, detail="menu not found")
    return m

def _validate_text(payload: Dict[str, Any]) -> str:
    text = (payload.get("text") or "")
    if not text.strip():
        raise HTTPException(status_code=400, detail="text required")
    return text.strip()

# テストで monkeypatch される想定
def moderate_text(text: str) -> Dict[str, Any]:
    return {"allowed": True, "category": "safe"}

def _post_comment(menu_id: int, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    _get_menu_or_404(db, menu_id)
    text = _validate_text(payload)
    verdict = moderate_text(text)
    if not verdict.get("allowed", False):
        raise HTTPException(status_code=400, detail=f"blocked: {verdict.get('category','')}")
    user = payload.get("user") or None
    c = Comment(menu_id=menu_id, user=user, text=text)
    db.add(c); db.commit(); db.refresh(c)
    return {
        "id": c.id,
        "menu_id": c.menu_id,
        "user": c.user,
        "text": c.text,
        "created_at": str(c.created_at),
    }

def _list_comments(menu_id: int, db: Session) -> List[Dict[str, Any]]:
    _get_menu_or_404(db, menu_id)
    rows = (
        db.execute(
            select(Comment)
            .where(Comment.menu_id == menu_id)
            .order_by(desc(Comment.id), desc(Comment.created_at))  # 新しい順を安定化
        )
        .scalars()
        .all()
    )
    return [
        {
            "id": c.id,
            "menu_id": c.menu_id,
            "user": c.user,
            "text": c.text,
            "created_at": str(c.created_at),
        }
        for c in rows
    ]

@router.post("/menus/{menu_id}/comments", status_code=201)
def post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    return _post_comment(menu_id, payload, db)

@router.get("/menus/{menu_id}/comments")
def list_comments(menu_id: int, db: Session = Depends(get_db)):
    return _list_comments(menu_id, db)

# /api 側
@api_router.post("/menus/{menu_id}/comments", status_code=201)
def api_post_comment(menu_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    return _post_comment(menu_id, payload, db)

@api_router.get("/menus/{menu_id}/comments")
def api_list_comments(menu_id: int, db: Session = Depends(get_db)):
    return _list_comments(menu_id, db)