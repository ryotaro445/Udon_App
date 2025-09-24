# app/routers/tables.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import uuid4
from app. models import Table
from app. schemas import TableCreate, TableOut
from backend.app.database import get_db

router = APIRouter(prefix="/tables", tags=["tables"])

@router.post("", response_model=TableOut)
def create_table(payload: TableCreate, db: Session = Depends(get_db)):
    code = uuid4().hex[:12]
    t = Table(name=payload.name, code=code)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.get("/{code}", response_model=TableOut)
def get_table_by_code(code: str, db: Session = Depends(get_db)):
    t = db.scalar(select(Table).where(Table.code == code))
    if not t:
        raise HTTPException(status_code=404, detail="Table not found")
    return t