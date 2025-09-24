# backend/app/routers/test_reset.py
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi import Depends
from app import seed  # 既存のシード関数を想定

router = APIRouter()

@router.post("/api/test/reset")
def test_reset(db: Session = Depends(get_db)):
    try:
        seed.reset_and_seed(db)  # DBドロップ→作成→シード、等 既存に合わせて実装
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))