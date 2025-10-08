# backend/app/routers/posts.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from itertools import count
from datetime import datetime

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
  createdAt: Optional[str] = None   # ISO文字列で保持（フロントで日付整形）

# ----- インメモリ保存（デモ用） -----
_posts: List[Post] = []
_seq = count(1)

# ----- エンドポイント -----
@router.get("/posts", response_model=List[Post], tags=["posts"])
def list_posts(limit: int = Query(50, ge=1, le=200), category: Optional[str] = None):
  items = _posts
  if category:
    items = [p for p in items if p.category == category]
  # pinned を先頭、その中で createdAt 降順（なければ id 降順）
  def sort_key(p: Post):
    created_sort = p.createdAt or ""
    return (not (p.pinned or False), created_sort, p.id)
  # createdAt を新しい順にしたいので reverse=True
  items = sorted(items, key=sort_key, reverse=True)
  return items[:limit]

@router.post("/posts", response_model=Post, status_code=201, tags=["posts"])
def create_post(payload: PostIn):
  p = Post(id=next(_seq), **payload.model_dump())
  # 作成時刻をISOで付与
  p.createdAt = datetime.now().isoformat()
  _posts.append(p)
  return p

@router.delete("/posts/{post_id}", status_code=204, tags=["posts"])
def delete_post(post_id: int):
  for i, p in enumerate(_posts):
    if p.id == post_id:
      _posts.pop(i)
      return
  raise HTTPException(status_code=404, detail="Not Found")

# NEW: ピン留め切替（POSTでも受ける：フロントのapiPostを使えるように）
class PinPayload(BaseModel):
  pinned: bool

@router.post("/posts/{post_id}/pin", tags=["posts"])
def set_pin_post(post_id: int, payload: PinPayload):
  for p in _posts:
    if p.id == post_id:
      p.pinned = payload.pinned
      return {"ok": True, "pinned": p.pinned}
  raise HTTPException(status_code=404, detail="Not Found")