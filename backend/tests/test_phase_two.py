from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.seed import GREEN_CHILLI_MANAGER_PHONE, seed_merchant_staff
from app.models import (
    Bill,
    BillClaimStatus,
    BillClaimToken,
    BillSource,
    Restaurant,
    RestaurantStaff,
    RewardClaim,
    RewardTransaction,
    StaffRole,
)
from app.services.claim_tokens import hash_claim_token


def _login(client: TestClient, phone: str) -> dict[str, str]:
    response = client.post(
        "/auth/verify-otp", json={"phone": phone, "otp": "123456"}
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _merchant_headers(
    client: TestClient, session_factory: sessionmaker[Session]
) -> dict[str, str]:
    with session_factory() as db:
        seed_merchant_staff(db)
    return _login(client, GREEN_CHILLI_MANAGER_PHONE)


def _green_chilli_id(client: TestClient) -> str:
    restaurants = client.get("/restaurants").json()
    return next(item["id"] for item in restaurants if item["slug"] == "green-chilli")


def _create_bill(
    client: TestClient,
    session_factory: sessionmaker[Session],
    *,
    bill_number: str = "GC-PHASE2-001",
    bill_amount: str = "500.00",
) -> tuple[dict[str, str], dict[str, object]]:
    headers = _merchant_headers(client, session_factory)
    response = client.post(
        f"/merchant/restaurants/{_green_chilli_id(client)}/bills",
        headers=headers,
        json={"bill_number": bill_number, "bill_amount": bill_amount},
    )
    assert response.status_code == 201, response.text
    return headers, response.json()


def test_merchant_staff_seed_is_idempotent_and_has_manager_role(
    session_factory: sessionmaker[Session],
) -> None:
    with session_factory() as db:
        first = seed_merchant_staff(db)
        second = seed_merchant_staff(db)
        assert first.id == second.id
        assert second.role == StaffRole.MANAGER
        assert second.is_active is True
        assert second.user.phone == GREEN_CHILLI_MANAGER_PHONE
        assert second.user.name == "Green Chilli Manager"
        assert db.scalar(select(func.count(RestaurantStaff.id))) == 1


def test_customer_cannot_use_merchant_endpoints(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get("/merchant/me", headers=auth_headers)
    assert response.status_code == 403
    assert response.json() == {"detail": "Merchant access required"}


def test_manager_can_only_access_assigned_restaurant(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    headers = _merchant_headers(client, session_factory)
    profile = client.get("/merchant/me", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["memberships"][0]["role"] == "MANAGER"
    assert profile.json()["memberships"][0]["restaurant"]["slug"] == "green-chilli"

    other_id = next(
        item["id"]
        for item in client.get("/restaurants").json()
        if item["slug"] == "operation-falafel"
    )
    denied = client.get(f"/merchant/restaurants/{other_id}/dashboard", headers=headers)
    assert denied.status_code == 403


def test_inactive_membership_loses_merchant_access(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    headers = _merchant_headers(client, session_factory)
    with session_factory() as db:
        membership = db.scalar(select(RestaurantStaff))
        assert membership is not None
        membership.is_active = False
        db.commit()
    assert client.get("/merchant/me", headers=headers).status_code == 403


def test_bill_creation_is_server_authoritative_and_token_is_hash_only(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    headers = _merchant_headers(client, session_factory)
    response = client.post(
        f"/merchant/restaurants/{_green_chilli_id(client)}/bills",
        headers=headers,
        json={
            "bill_number": " gc-500 ",
            "bill_amount": "500.00",
            "reward_percentage": "99.00",
            "reward_amount": "495.00",
            "claim_status": "CLAIMED",
        },
    )
    assert response.status_code == 201
    payload = response.json()
    assert payload["bill"]["bill_number"] == "GC-500"
    assert payload["bill"]["bill_amount"] == "500.00"
    assert payload["bill"]["reward_percentage"] == "2.00"
    assert payload["bill"]["reward_amount"] == "10.00"
    assert payload["bill"]["source"] == "MERCHANT"
    assert payload["bill"]["claim_status"] == "UNCLAIMED"
    assert payload["claim"]["claim_url"].endswith(payload["claim"]["token"])

    with session_factory() as db:
        bill = db.get(Bill, UUID(payload["bill"]["id"]))
        token_record = db.scalar(select(BillClaimToken).where(BillClaimToken.bill_id == bill.id))
        assert bill is not None and bill.created_by_staff_id is not None
        assert bill.source == BillSource.MERCHANT
        assert token_record is not None
        assert token_record.token_hash == hash_claim_token(payload["claim"]["token"])
        assert token_record.token_hash != payload["claim"]["token"]


def test_duplicate_bill_number_is_scoped_and_returns_clean_conflict(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    headers, _ = _create_bill(client, session_factory, bill_number="SAME-001")
    duplicate = client.post(
        f"/merchant/restaurants/{_green_chilli_id(client)}/bills",
        headers=headers,
        json={"bill_number": "same-001", "bill_amount": "99.00"},
    )
    assert duplicate.status_code == 409
    assert duplicate.json() == {"detail": "This bill number has already been added."}


def test_claim_preview_requires_login_and_rejects_unknown_token(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    assert client.post("/claims/preview", json={"token": "x" * 43}).status_code == 401
    unknown = client.post(
        "/claims/preview", headers=auth_headers, json={"token": "x" * 43}
    )
    assert unknown.status_code == 404
    assert unknown.json() == {"detail": "Claim code is invalid"}


def test_expired_claim_token_returns_gone_and_updates_merchant_status(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    merchant_headers, created = _create_bill(client, session_factory, bill_number="EXP-001")
    with session_factory() as db:
        token_record = db.scalar(select(BillClaimToken))
        assert token_record is not None
        token_record.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.commit()

    preview = client.post(
        "/claims/preview",
        headers=auth_headers,
        json={"token": created["claim"]["token"]},
    )
    assert preview.status_code == 410
    detail = client.get(
        f"/merchant/bills/{created['bill']['id']}", headers=merchant_headers
    )
    assert detail.status_code == 200
    assert detail.json()["claim_status"] == "EXPIRED"


def test_refresh_invalidates_prior_token_and_restores_unclaimed_status(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    merchant_headers, created = _create_bill(client, session_factory, bill_number="REF-001")
    refreshed = client.post(
        f"/merchant/bills/{created['bill']['id']}/refresh-claim-token",
        headers=merchant_headers,
    )
    assert refreshed.status_code == 200
    assert refreshed.json()["token"] != created["claim"]["token"]

    old_preview = client.post(
        "/claims/preview",
        headers=auth_headers,
        json={"token": created["claim"]["token"]},
    )
    assert old_preview.status_code == 409
    new_preview = client.post(
        "/claims/preview",
        headers=auth_headers,
        json={"token": refreshed.json()["token"]},
    )
    assert new_preview.status_code == 200
    assert new_preview.json()["reward_amount"] == "10.00"

    with session_factory() as db:
        records = list(
            db.scalars(
                select(BillClaimToken).where(
                    BillClaimToken.bill_id == UUID(created["bill"]["id"])
                )
            ).all()
        )
        assert len(records) == 2
        assert sum(record.invalidated_at is not None for record in records) == 1


def test_token_claim_uses_existing_ledger_and_marks_single_use(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    _merchant_headers_value, created = _create_bill(
        client, session_factory, bill_number="CLAIM-001"
    )
    preview = client.post(
        "/claims/preview",
        headers=auth_headers,
        json={"token": created["claim"]["token"]},
    )
    assert preview.status_code == 200
    assert preview.json()["restaurant"]["name"] == "Green Chilli"

    manipulated = client.post(
        "/claims/claim",
        headers=auth_headers,
        json={"token": created["claim"]["token"], "reward_amount": "999.00"},
    )
    assert manipulated.status_code == 422

    claimed = client.post(
        "/claims/claim",
        headers=auth_headers,
        json={"token": created["claim"]["token"]},
    )
    assert claimed.status_code == 200
    assert claimed.json()["reward_amount"] == "10.00"
    assert claimed.json()["updated_balance"] == "10.00"
    assert claimed.json()["bill"]["claim_status"] == "CLAIMED"

    with session_factory() as db:
        assert db.scalar(select(func.count(RewardTransaction.id))) == 1
        assert db.scalar(select(func.count(RewardClaim.id))) == 1
        token_record = db.scalar(select(BillClaimToken))
        assert token_record is not None and token_record.consumed_at is not None


def test_claim_token_cannot_be_reused_by_same_or_different_customer(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    _headers, created = _create_bill(client, session_factory, bill_number="ONCE-001")
    body = {"token": created["claim"]["token"]}
    assert client.post("/claims/claim", headers=auth_headers, json=body).status_code == 200
    assert client.post("/claims/claim", headers=auth_headers, json=body).status_code == 409
    other_headers = _login(client, "+971501111112")
    assert client.post("/claims/claim", headers=other_headers, json=body).status_code == 409

    with session_factory() as db:
        assert db.scalar(select(func.count(RewardTransaction.id))) == 1
        assert db.scalar(select(func.count(RewardClaim.id))) == 1


def test_dashboard_history_filters_and_claimed_bill_cannot_refresh(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    merchant_headers, first = _create_bill(
        client, session_factory, bill_number="DASH-001", bill_amount="500.00"
    )
    client.post(
        f"/merchant/restaurants/{_green_chilli_id(client)}/bills",
        headers=merchant_headers,
        json={"bill_number": "DASH-002", "bill_amount": "250.00"},
    )
    claim = client.post(
        "/claims/claim",
        headers=auth_headers,
        json={"token": first["claim"]["token"]},
    )
    assert claim.status_code == 200

    dashboard = client.get(
        f"/merchant/restaurants/{_green_chilli_id(client)}/dashboard",
        headers=merchant_headers,
    )
    assert dashboard.status_code == 200
    assert dashboard.json()["today_bills"] == 2
    assert dashboard.json()["today_claimed_bills"] == 1
    assert dashboard.json()["today_unclaimed_bills"] == 1
    assert dashboard.json()["today_sales_tracked"] == "750.00"
    assert dashboard.json()["today_rewards_issued"] == "10.00"

    history = client.get(
        f"/merchant/restaurants/{_green_chilli_id(client)}/bills",
        headers=merchant_headers,
        params={"claim_status": BillClaimStatus.CLAIMED.value},
    )
    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["items"][0]["bill_number"] == "DASH-001"

    refresh = client.post(
        f"/merchant/bills/{first['bill']['id']}/refresh-claim-token",
        headers=merchant_headers,
    )
    assert refresh.status_code == 409


def test_cancelled_bill_token_is_not_claimable(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    _headers, created = _create_bill(client, session_factory, bill_number="CANCEL-001")
    with session_factory() as db:
        bill = db.get(Bill, UUID(created["bill"]["id"]))
        assert bill is not None
        bill.claim_status = BillClaimStatus.CANCELLED
        db.commit()
    response = client.post(
        "/claims/claim",
        headers=auth_headers,
        json={"token": created["claim"]["token"]},
    )
    assert response.status_code == 422


def test_inactive_restaurant_token_is_not_claimable(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    _headers, created = _create_bill(client, session_factory, bill_number="INACTIVE-001")
    with session_factory() as db:
        restaurant = db.scalar(select(Restaurant).where(Restaurant.slug == "green-chilli"))
        assert restaurant is not None
        restaurant.active = False
        db.commit()
    response = client.post(
        "/claims/preview",
        headers=auth_headers,
        json={"token": created["claim"]["token"]},
    )
    assert response.status_code == 409
