# backend/app/routers/reset_seed.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import seed

router = APIRouter()

@router.post("/api/test/reset")
def reset_db(db: Session = Depends(get_db)):
    try:
        seed.reset_and_seed(db)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))