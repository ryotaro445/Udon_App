import os
import tempfile
import pathlib
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# アプリ本体のimport（あなたの構成に合わせて）
from app.main import app
from app.database import Base  # SQLAlchemy Base
from app.routers.deps import get_db  # 実運用の依存を上書きする
# ↑ depsの場所が違う場合は get_db の実体がある場所から import

os.environ["DB_PATH"] = "./udon.db"
os.environ["RESET_DB"] = "1"

# ---- テスト用DB（SQLite一時ファイル）を用意 ----
@pytest.fixture(scope="session")
def _tmp_db_path():
    fd, path = tempfile.mkstemp(suffix=".sqlite")
    os.close(fd)
    yield path
    try:
        pathlib.Path(path).unlink(missing_ok=True)
    except Exception:
        pass

@pytest.fixture(scope="session")
def engine(_tmp_db_path):
    url = f"sqlite:///{_tmp_db_path}"
    eng = create_engine(url, connect_args={"check_same_thread": False})
    # セッションを通じた外部結合で高速化したい場合は pool_pre_ping等を足してOK
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)

@pytest.fixture(scope="session")
def TestingSessionLocal(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---- DBセッションfixture（functionスコープ） ----
@pytest.fixture()
def db(TestingSessionLocal):
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

# ---- get_db をテスト用に差し替え ----
@pytest.fixture(scope="session", autouse=True)
def _override_get_db(TestingSessionLocal):
    def _get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = _get_db
    yield
    app.dependency_overrides.pop(get_db, None)

# ---- TestClient ----
@pytest.fixture()
def client():
    return TestClient(app)

# ---- シード投入 ----
from app import models  # Menu, Order, OrderItem, Comment 等を想定

@pytest.fixture()
def seed_data(db):
    # 既存データ全削除（外部キー順に注意：単純化のため try/except で雑に）
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()

    menus = [
        models.Menu(name="かけうどん", price=400, stock=10),
        models.Menu(name="きつねうどん", price=500, stock=5),
        models.Menu(name="天ぷらうどん", price=650, stock=2),
    ]
    db.add_all(menus)
    db.commit()
    return {"menu_ids": [m.id for m in db.query(models.Menu).order_by(models.Menu.id).all()]}