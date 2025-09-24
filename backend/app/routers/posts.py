# app/routers/posts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import List
from app.routers.deps import get_db, require_staff
from app.models import Post
from app.schemas import PostCreate, PostOut


router = APIRouter(prefix="/posts", tags=["posts"])  # /api/posts


@router.get("", response_model=List[PostOut])
def list_posts(limit: int = 50, db: Session = Depends(get_db), category: str | None = None):
    stmt = select(Post)
    if category:
        stmt = stmt.where(Post.category == category)
    stmt = select(Post).order_by(desc(Post.created_at), desc(Post.id)).limit(min(200, max(1, limit)))
    return list(db.execute(stmt).scalars())



@router.post("", response_model=PostOut, status_code=201, dependencies=[Depends(require_staff)])  
def create_post(payload: PostCreate, db: Session = Depends(get_db)):
    title = payload.title.strip()
    body = payload.body.strip()
    author = payload.author.strip()
    if not title or not body or not author:
        raise HTTPException(status_code=400, detail="empty fields")
    p = Post(
        title=title,
        body=body,
        author=author,
        category=payload.category,   
        pinned=payload.pinned or False,  
    )
    db.add(p); db.commit(); db.refresh(p)
    return p



@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(status_code=404, detail="post not found")
    db.delete(p); db.commit()
    return None