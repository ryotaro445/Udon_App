# -*- coding: utf-8 -*-
"""
フェーズ6：デモで使う主要フローのみを検証する最小テスト
- メニュー取得（ページング／価格順）
- 注文作成 → 明細取得 → ステータス更新
- コメント投稿（正常系）

既存の tests/conftest.py の `client` フィクスチャ（TestClient）を利用します。
"""

from typing import List, Dict
import pytest

# --- ユーティリティ ---------------------------------------------------------

def nondecreasing(xs: List[int]) -> bool:
    return all(xs[i] <= xs[i+1] for i in range(len(xs)-1))

def nonincreasing(xs: List[int]) -> bool:
    return all(xs[i] >= xs[i+1] for i in range(len(xs)-1))


# --- メニュー一覧：ページング & 並び替え -------------------------------------

def test_menus_pagination(client):
    r = client.get("/menus?limit=5&offset=0")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert 0 < len(data) <= 5  # 5件以内で返る

    # offset をずらして重複が極端に発生しないこと（厳密一致までは見ない）
    r2 = client.get("/menus?limit=5&offset=5")
    assert r2.status_code == 200
    data2 = r2.json()
    assert isinstance(data2, list)
    # どちらも空でない場合は先頭要素が異なる可能性が高い
    if data and data2:
        assert data[0]["id"] != data2[0]["id"]


def test_menus_order_by_price_asc(client):
    # 価格の昇順（order=price 想定）
    r = client.get("/menus?limit=10&offset=0&order=price")
    assert r.status_code == 200
    menus = r.json()
    prices = [m["price"] for m in menus]
    assert nondecreasing(prices), f"Prices are not nondecreasing: {prices}"


def test_menus_order_by_price_desc(client):
    # 価格の降順（order=-price 想定）
    r = client.get("/menus?limit=10&offset=0&order=-price")
    assert r.status_code == 200
    menus = r.json()
    prices = [m["price"] for m in menus]
    assert nonincreasing(prices), f"Prices are not nonincreasing: {prices}"


# --- 注文フロー：作成 → 取得 → ステータス更新 --------------------------------

@pytest.mark.order(1)
def test_order_create_and_get_detail(client):
    # まずメニューを少なくとも2件取得（価格や在庫はここでは細かく見ない）
    mr = client.get("/menus?limit=2&offset=0")
    assert mr.status_code == 200
    menus = mr.json()
    assert len(menus) >= 1, "シードデータ不足：少なくとも1件のメニューが必要です"

    # 1〜2件で注文を作る（2件未満なら1件で作成）
    items = []
    items.append({"menu_id": menus[0]["id"], "quantity": 1})
    if len(menus) >= 2:
        items.append({"menu_id": menus[1]["id"], "quantity": 2})

    payload = {"table_id": 1, "items": items}
    r = client.post("/orders", json=payload)
    assert r.status_code in (200, 201)
    order = r.json()
    assert "id" in order and "status" in order and "items" in order and "total" in order

    # total が items の price*qty の合計と合うか（レスポンスの items.price を信頼）
    resp_items: List[Dict] = order["items"]
    calc_total = sum(it["price"] * it["quantity"] for it in resp_items)
    assert order["total"] == calc_total

    # 取得して同じ構造が返るか
    oid = order["id"]
    r2 = client.get(f"/orders/{oid}")
    assert r2.status_code == 200
    detail = r2.json()
    assert detail["id"] == oid
    assert detail["total"] == calc_total
    assert detail["status"] == order["status"]


@pytest.mark.order(2)
def test_order_status_update(client):
    # 新規で軽量な注文を作る
    mr = client.get("/menus?limit=1&offset=0")
    assert mr.status_code == 200
    menus = mr.json()
    assert len(menus) >= 1
    payload = {"table_id": 99, "items": [{"menu_id": menus[0]["id"], "quantity": 1}]}
    cr = client.post("/orders", json=payload)
    assert cr.status_code in (200, 201)
    oid = cr.json()["id"]

    # ステータス更新
    pr = client.patch(f"/orders/{oid}", json={"status": "served"})
    assert pr.status_code == 200
    updated = pr.json()
    assert updated["id"] == oid
    assert updated["status"] == "served"


# --- コメント投稿：正常系 -----------------------------------------------------

def test_post_comment_ok(client):
    # 適当なメニューIDを取得
    mr = client.get("/menus?limit=1&offset=0")
    assert mr.status_code == 200
    menus = mr.json()
    assert len(menus) >= 1
    mid = menus[0]["id"]

    # 正常なコメントを投稿
    payload = {"user": "tester", "text": "おいしい！また頼みたいです。"}
    r = client.post(f"/menus/{mid}/comments", json=payload)
    assert r.status_code in (200, 201)
    body = r.json()
    assert body["text"] == payload["text"]
    # user が省略可能な実装の場合に備えて存在時のみ検証
    if "user" in body:
        assert body["user"] in (payload["user"], None)