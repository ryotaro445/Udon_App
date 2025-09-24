import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import get_db
from sqlalchemy.orm import Session
from app.services.moderation import SimpleRulesModeration

client = TestClient(app)

# 依存のモデレーターを SimpleRules に固定（本番と同じだがテストで明示）
@pytest.fixture(autouse=True)
def use_simple_moderator(monkeypatch):
    from app import services
    from app.services import moderation
    monkeypatch.setenv("MODERATION_MODE", "simple")
    yield

def ensure_menu_id() -> int:
    # 既に seed がある想定ならそれを使う。無ければ適宜作成 API を呼ぶ。
    # ここでは最初のメニューID 1 を使う前提にしておく。
    return 1

@pytest.mark.parametrize("text, expect_status", [
    ("おいしかった！また来ます！", 201),                    # ✅ 通す
    ("バカ", 400),                                          # ❌ NGワード
    ("最高！ https://a.com https://b.com https://c.com", 400),  # ❌ URLスパム
    ("a" * 500, 400),                                       # ❌ 長文スパム
    ("普通のコメントです。味もしっかりしてました。", 201),     # ✅ 通す
])
def test_create_comment_moderation(text, expect_status):
    menu_id = ensure_menu_id()
    r = client.post(f"/menus/{menu_id}/comments", json={"user": "tester", "text": text})
    assert r.status_code == expect_status
    if r.status_code == 400:
        # detail メッセージ確認（UI側で使う）
        assert "コメントがポリシーに違反" in r.json()["detail"]