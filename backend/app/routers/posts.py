# backend/app/routers/posts.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from itertools import count

router = APIRouter()  # ← prefixは付けない（/apiはmain側で付与）

class PostIn(BaseModel):
    title: str
    body: str
    author: str
    category: Optional[str] = None
    pinned: Optional[bool] = False

class Post(PostIn):
    id: int

# 超シンプルなインメモリ実装（Render再起動で消えます）
_posts: List[Post] = []
_seq = count(1)

@router.get("/posts", response_model=List[Post], tags=["posts"])
def list_posts(limit: int = Query(50, ge=1, le=200), category: Optional[str] = None):
    items = _posts
    if category:
        items = [p for p in items if p.category == category]
    # pinned優先でソート → id降順
    items = sorted(items, key=lambda p: (not p.pinned, -p.id))
    return items[:limit]

@router.post("/posts", response_model=Post, status_code=201, tags=["posts"])
def create_post(payload: PostIn):
    p = Post(id=next(_seq), **payload.model_dump())
    _posts.append(p)
    return p

@router.delete("/posts/{post_id}", status_code=204, tags=["posts"])
def delete_post(post_id: int):
    idx = next((i for i, p in enumerate(_posts) if p.id == post_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Not Found")
    _posts.pop(idx)
    return None