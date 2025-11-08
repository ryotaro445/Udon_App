# app/deps.py
from typing import Generator
from sqlalchemy.orm import Session
from ..database import SessionLocal
import os
from fastapi import Header, HTTPException, status


# FastAPI 依存関係として使う DB セッション
def get_db() -> Generator[Session, None, None]:
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_staff(x_staff_token: str | None = Header(None, alias="X-Staff-Token")):
    """
    従業員用トークンを検証。環境変数 STAFF_TOKEN が設定されている時のみ有効。
    未設定ならデモモードとして誰でも通す。
    """
    expected = os.getenv("STAFF_TOKEN")
    if not expected:
        # STAFF_TOKEN が未設定ならチェックしない（開発・デモ用）
        return

    if not x_staff_token or x_staff_token != expected:
        # 認証エラー（ステータスは 401 の方が意味的に近いので変更）
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="forbidden: staff token required",
        )