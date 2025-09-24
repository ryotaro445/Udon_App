# app/deps.py
from typing import Generator
from sqlalchemy.orm import Session
from ..database import SessionLocal
import os
from fastapi import Header, HTTPException




# FastAPI 依存関係として使う DB セッション
def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def require_staff(x_staff_token: str = Header(None)):
    """
    従業員用トークンを検証。環境変数 STAFF_TOKEN が設定されている時のみ有効。
    未設定ならデモモードとして誰でも通す。
    """
    expected = os.getenv("STAFF_TOKEN")
    if not expected:
        return  # デモ中はスキップ
    if not x_staff_token or x_staff_token != expected:
        raise HTTPException(status_code=403, detail="forbidden: staff token required")