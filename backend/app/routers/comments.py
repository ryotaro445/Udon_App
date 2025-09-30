# backend/app/routers/comments.py
"""
互換レイヤー：
このモジュールは menu_comments の router を再利用します。
実体実装は app/routers/menu_comments.py に一本化してください。
"""
from __future__ import annotations
from app.routers.menu_comments import router  # re-export

__all__ = ["router"]