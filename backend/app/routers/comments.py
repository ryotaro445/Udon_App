# backend/app/routers/comments.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from ..database import get_db
from ..models import Menu, Comment
from app.services.moderation import get_moderation_client

router = APIRouter(prefix="/api", tags=["comments"])

def moderate_text(text: str) -> dict:
    """
    本番用：OpenAI Moderation を呼び出す。
    テストではここを monkeypatch すれば従来どおり動く。
    戻り値は {allowed: bool, reason: str|None} 形式に統一。
    """
    ok, reason = get_moderation_client().check(text)
    return {"allowed": ok, "reason": reason}

@router.post("/menus/{menu_id}/comments", status_code=201)
def api_post_comment(menu_id: int, payload: dict, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")

    result = moderate_text(text)
    if not result.get("allowed", False):
        reason = result.get("reason") or "unsafe"
        # services/moderation.py の文言に合わせる（フロントがパースする）
        if "moderation disabled" in reason:
            raise HTTPException(status_code=503, detail=reason)
        if "moderation error" in reason:
            raise HTTPException(status_code=502, detail=reason)
        raise HTTPException(status_code=400, detail=f"blocked by moderation: {reason}")

    user = (payload.get("user") or "").strip() or None
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