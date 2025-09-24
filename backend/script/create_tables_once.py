# scripts/create_tables_once.py（開発用スクリプト）
from backend.app.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)