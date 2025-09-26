from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from ..database import get_db
from ..models import Menu, Comment
from ..services.moderation import get_moderation_client  # ★ 追加

router = APIRouter(prefix="/api", tags=["comments"])


@router.post("/menus/{menu_id}/comments", status_code=201)
def api_post_comment(menu_id: int, payload: dict, db: Session = Depends(get_db)):
    if not db.get(Menu, menu_id):
        raise HTTPException(status_code=404, detail="menu not found")

    text = (payload.get("text") or "").strip()
    user = (payload.get("user") or "").strip() or None

    # --- AI moderation ---
    client = get_moderation_client()
    allowed, reason = client.check(text)
    if not allowed:
        raise HTTPException(status_code=400, detail=reason or "comment blocked")

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
        {
            "id": c.id,
            "user": c.user,
            "text": c.text,
            "created_at": c.created_at.isoformat(),
        }
        for c in rows
    ]