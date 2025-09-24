def test_top_menus_counts(client, seed_data):
    # データを作る：かけうどん×2、きつね×1
    menus = client.get("/api/menus").json()
    kake = next(m for m in menus if m["name"] == "かけうどん")
    kitsune = next(m for m in menus if m["name"] == "きつねうどん")

    client.post("/api/orders", json={"items":[{"menu_id": kake["id"], "qty": 2}], "table_no":1})
    client.post("/api/orders", json={"items":[{"menu_id": kitsune["id"], "qty": 1}], "table_no":2})

    # 集計を確認
    res = client.get("/api/analytics/top-menus", params={"limit": 5, "days": 30})
    assert res.status_code == 200
    rows = res.json()
    # 形式チェック
    assert isinstance(rows, list) and len(rows) >= 2
    names = [r["name"] for r in rows]
    assert "かけうどん" in names and "きつねうどん" in names
    # 数量の多い順（想定）
    counts = {r["name"]: r.get("count") or r.get("qty") for r in rows}
    assert counts["かけうどん"] >= counts["きつねうどん"]