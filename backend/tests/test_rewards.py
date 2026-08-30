from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.models import RewardClaim, RewardTransaction, TransactionStatus, TransactionType, User
from app.services.rewards import calculate_balance, calculate_reward


def _green_chilli_id(client: TestClient) -> str:
    restaurants = client.get("/restaurants").json()
    return next(item["id"] for item in restaurants if item["slug"] == "green-chilli")


def test_reward_calculation_uses_decimal_rounding() -> None:
    assert calculate_reward(Decimal("500.00"), Decimal("2.00")) == Decimal("10.00")
    assert calculate_reward(Decimal("19.99"), Decimal("3.00")) == Decimal("0.60")


def test_balance_is_calculated_from_completed_ledger(
    session_factory: sessionmaker[Session],
) -> None:
    with session_factory() as db:
        user = User(phone="+971501111111")
        db.add(user)
        db.flush()
        db.add_all(
            [
                RewardTransaction(
                    id=uuid4(), user_id=user.id, type=TransactionType.EARN,
                    amount=Decimal("10.00"), status=TransactionStatus.COMPLETED,
                    description="Earned",
                ),
                RewardTransaction(
                    id=uuid4(), user_id=user.id, type=TransactionType.EARN,
                    amount=Decimal("8.50"), status=TransactionStatus.COMPLETED,
                    description="Earned",
                ),
                RewardTransaction(
                    id=uuid4(), user_id=user.id, type=TransactionType.REDEEM,
                    amount=Decimal("-5.00"), status=TransactionStatus.COMPLETED,
                    description="Redeemed",
                ),
                RewardTransaction(
                    id=uuid4(), user_id=user.id, type=TransactionType.EARN,
                    amount=Decimal("99.00"), status=TransactionStatus.PENDING,
                    description="Pending",
                ),
            ]
        )
        db.flush()
        assert calculate_balance(db, user.id) == Decimal("13.50")


def test_demo_bill_claim_creates_ledger_updates_balance_and_rejects_duplicate(
    client: TestClient,
    auth_headers: dict[str, str],
    session_factory: sessionmaker[Session],
) -> None:
    restaurant_id = _green_chilli_id(client)
    demo_response = client.post(
        "/bills/demo",
        headers=auth_headers,
        json={
            "restaurant_id": restaurant_id,
            "bill_amount": "500.00",
            "reward_amount": "9999.00",
            "reward_percentage": "99.00",
            "restaurant_name": "Attacker supplied name",
        },
    )
    assert demo_response.status_code == 201
    bill = demo_response.json()
    assert bill["restaurant"]["name"] == "Green Chilli"
    assert bill["bill_amount"] == "500.00"
    assert bill["reward_percentage"] == "2.00"
    assert bill["reward_amount"] == "10.00"
    assert bill["claimable"] is True

    claim_response = client.post(f"/bills/{bill['id']}/claim", headers=auth_headers)
    assert claim_response.status_code == 200
    claim = claim_response.json()
    assert claim["reward_amount"] == "10.00"
    assert claim["updated_balance"] == "10.00"
    assert claim["transaction"]["type"] == "EARN"
    assert claim["transaction"]["status"] == "COMPLETED"
    assert claim["transaction"]["restaurant"]["name"] == "Green Chilli"

    balance_response = client.get("/rewards/balance", headers=auth_headers)
    assert balance_response.status_code == 200
    assert balance_response.json() == {"balance": "10.00", "currency": "AED"}

    transactions_response = client.get("/rewards/transactions", headers=auth_headers)
    assert transactions_response.status_code == 200
    transactions = transactions_response.json()
    assert len(transactions) == 1
    assert transactions[0]["id"] == claim["transaction"]["id"]

    detail_response = client.get(
        f"/rewards/transactions/{transactions[0]['id']}", headers=auth_headers
    )
    assert detail_response.status_code == 200

    duplicate_response = client.post(f"/bills/{bill['id']}/claim", headers=auth_headers)
    assert duplicate_response.status_code == 409
    assert duplicate_response.json() == {"detail": "Bill has already been claimed"}

    with session_factory() as db:
        assert db.scalar(select(func.count(RewardTransaction.id))) == 1
        assert db.scalar(select(func.count(RewardClaim.id))) == 1


def test_bill_that_rounds_to_zero_reward_is_rejected_cleanly(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    restaurant_id = _green_chilli_id(client)
    demo = client.post(
        "/bills/demo",
        headers=auth_headers,
        json={"restaurant_id": restaurant_id, "bill_amount": "0.01"},
    )
    assert demo.status_code == 201
    assert demo.json()["reward_amount"] == "0.00"

    claim = client.post(f"/bills/{demo.json()['id']}/claim", headers=auth_headers)
    assert claim.status_code == 422
    assert claim.json() == {"detail": "Bill does not produce a claimable reward"}
