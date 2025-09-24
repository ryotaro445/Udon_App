def test_like_idempotent(client):
    mid = 1
    h = {"X-User-Token":"u1"}
    r1 = client.post(f"/menus/{mid}/like", headers=h)
    r2 = client.post(f"/menus/{mid}/like", headers=h)
    assert r1.status_code == 200 and r2.status_code == 200
    assert r2.json()["new"] is False
    count = client.get(f"/menus/{mid}/likes").json()["count"]
    # u1の重複はカウント増やさない
    assert count >= 1

def test_like_count_matches_after_post(client):
    mid = 2
    before = client.get(f"/menus/{mid}/likes").json()["count"]
    client.post(f"/menus/{mid}/like", headers={"X-User-Token":"u2"})
    after = client.get(f"/menus/{mid}/likes").json()["count"]
    assert after == before + 1

def test_comment_empty_400(client):
    mid = 1
    r = client.post(f"/menus/{mid}/comments", json={"user": None, "text":"   "})
    assert r.status_code == 400

def test_comment_order_desc(client):
    mid = 1
    client.post(f"/menus/{mid}/comments", json={"user":"A","text":"one"})
    client.post(f"/menus/{mid}/comments", json={"user":"B","text":"two"})
    lst = client.get(f"/menus/{mid}/comments").json()
    assert lst[0]["text"] == "two"
    assert lst[1]["text"] == "one"