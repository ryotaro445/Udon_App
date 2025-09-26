# backend/app/routers/posts.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from itertools import count

# ※ prefix は付けない（/api は main 側で付けてマウント）
router = APIRouter()

# ----- スキーマ -----
class PostIn(BaseModel):
    title: str
    body: str
    author: str
    category: Optional[str] = None
    pinned: Optional[bool] = False

class Post(PostIn):
    id: int

# ----- インメモリ保存（デモ用） -----
_posts: List[Post] = []
_seq = count(1)

# ----- エンドポイント -----
@router.get("/posts", response_model=List[Post], tags=["posts"])
def list_posts(limit: int = Query(50, ge=1, le=200), category: Optional[str] = None):
    items = _posts
    if category:
        items = [p for p in items if p.category == category]
    # pinned を先頭、その中で id 降順
    items = sorted(items, key=lambda p: (not p.pinned, -p.id))
    return items[:limit]

@router.post("/posts", response_model=Post, status_code=201, tags=["posts"])
def create_post(payload: PostIn):
    p = Post(id=next(_seq), **payload.model_dump())
    _posts.append(p)
    return p

@router.delete("/posts/{post_id}", status_code=204, tags=["posts"])
def delete_post(post_id: int):
    for i, p in enumerate(_posts):
        if p.id == post_id:
            _posts.pop(i)
            return
    raise HTTPException(status_code=404, detail="Not Found")