# app/util/payload.py
from __future__ import annotations
from fastapi import HTTPException
from typing import Mapping, Any

_POSSIBLE_KEYS = ("body", "text", "comment", "message")

def extract_comment_text(payload: Mapping[str, Any]) -> str:
    for k in _POSSIBLE_KEYS:
        v = payload.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    raise HTTPException(status_code=400, detail="empty text")