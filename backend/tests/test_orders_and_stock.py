def test_list_order_ids_by_status(client):
    r = client.get("/orders?status=placed")
    assert r.status_code == 200
    ids = r.json()
    assert isinstance(ids, list)
    assert ids == sorted(ids)

def test_order_detail_total_correct(client):
    # 事前シード: menu1(390) x2, menu3(680) x1 → 390*2 + 680 = 1460
    r_ids = client.get("/orders?status=placed")
    oid = r_ids.json()[0]
    detail = client.get(f"/orders/{oid}")
    assert detail.status_code == 200
    assert detail.json()["total"] == 1460

def test_valid_status_transitions(client):
    r_ids = client.get("/orders?status=placed")
    oid = r_ids.json()[0]
    r1 = client.patch(f"/orders/{oid}", json={"status":"cooking"})
    assert r1.status_code == 200
    r2 = client.patch(f"/orders/{oid}", json={"status":"served"})
    assert r2.status_code == 200

# 無効遷移ガード（サーバ側で弾く実装を入れる予定なら先にRedで）
def test_invalid_transition_should_fail(client):
    r_ids = client.get("/orders?status=placed")
    oid = r_ids.json()[0]
    # まず最終状態に
    client.patch(f"/orders/{oid}", json={"status":"cooking"})
    client.patch(f"/orders/{oid}", json={"status":"served"})
    # served → cooking はNGにしたい（現状の実装でOKなら skip）
    r = client.patch(f"/orders/{oid}", json={"status":"cooking"})
    assert r.status_code in (400, 422, 409)



def test_create_order_decrements_stock(client, seed_data):
    # 1) 事前の在庫確認
    mres = client.get("/api/menus")
    menu = [x for x in mres.json() if x["name"] == "かけうどん"][0]
    menu_id = menu["id"]
    stock_before = menu["stock"]

    # 2) 注文作成（数量2）
    payload = {"items": [{"menu_id": menu_id, "qty": 2}], "table_no": 12}
    ores = client.post("/api/orders", json=payload)
    assert ores.status_code == 201
    order = ores.json()
    assert "id" in order
    assert order["status"] in ("created", "accepted", "pending")

    # 3) 在庫が2減っているか
    mres2 = client.get("/api/menus")
    menu2 = [x for x in mres2.json() if x["id"] == menu_id][0]
    assert menu2["stock"] == stock_before - 2