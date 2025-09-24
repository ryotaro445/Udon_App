import importlib

def test_comment_ok_word(client, seed_data, monkeypatch):
    # OK になるようにモック
    import app.routers.comments as comments_router
    def fake_moderate(text: str):
        return {"allowed": True, "category": "safe"}
    monkeypatch.setattr(comments_router, "moderate_text", fake_moderate, raising=False)
    importlib.reload(comments_router)

    menu_id = seed_data["menu_ids"][0]
    res = client.post(f"/api/menus/{menu_id}/comments", json={"text": "おいしかったです！"})
    assert res.status_code == 201
    body = res.json()
    assert body["text"] == "おいしかったです！"

def test_comment_ng_word(client, seed_data, monkeypatch):
    import app.routers.comments as comments_router
    def fake_moderate(text: str):
        return {"allowed": False, "category": "violence"}
    monkeypatch.setattr(comments_router, "moderate_text", fake_moderate, raising=False)

    menu_id = seed_data["menu_ids"][0]
    res = client.post(f"/api/menus/{menu_id}/comments", json={"text": "殺すぞ"})
    # 実装次第で 400/422/403 など。ここはあなたの実装に合わせて
    assert res.status_code in (400, 403, 422)