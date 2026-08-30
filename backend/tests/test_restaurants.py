from fastapi.testclient import TestClient


def test_restaurant_list_and_detail(client: TestClient) -> None:
    response = client.get("/restaurants")
    assert response.status_code == 200
    restaurants = response.json()
    assert len(restaurants) == 4

    by_slug = {restaurant["slug"]: restaurant for restaurant in restaurants}
    assert by_slug["green-chilli"]["reward_percentage"] == "2.00"
    assert by_slug["operation-falafel"]["reward_percentage"] == "10.00"
    assert by_slug["brunch-and-cake"]["reward_percentage"] == "5.00"
    assert by_slug["reif-japanese-kushiyaki"]["reward_percentage"] == "3.00"

    detail = client.get(f"/restaurants/{by_slug['green-chilli']['id']}")
    assert detail.status_code == 200
    assert detail.json()["name"] == "Green Chilli"


def test_missing_restaurant_returns_clean_404(client: TestClient) -> None:
    response = client.get("/restaurants/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert response.json() == {"detail": "Restaurant not found"}
