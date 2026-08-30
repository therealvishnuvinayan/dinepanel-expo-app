from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.models import User


def test_user_creation_and_existing_user_login(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    request_response = client.post("/auth/request-otp", json={"phone": "+971 50 123 4567"})
    assert request_response.status_code == 200
    assert "otp" not in request_response.json()

    first = client.post(
        "/auth/verify-otp", json={"phone": "+971501234567", "otp": "123456"}
    )
    assert first.status_code == 200
    first_payload = first.json()
    assert first_payload["token_type"] == "bearer"
    assert first_payload["user"]["phone"] == "+971501234567"

    second = client.post(
        "/auth/verify-otp", json={"phone": "+971501234567", "otp": "123456"}
    )
    assert second.status_code == 200
    assert second.json()["user"]["id"] == first_payload["user"]["id"]

    with session_factory() as db:
        assert db.scalar(select(func.count(User.id))) == 1

    me = client.get(
        "/me", headers={"Authorization": f"Bearer {second.json()['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["phone"] == "+971501234567"


def test_invalid_otp_and_invalid_token_are_rejected(client: TestClient) -> None:
    invalid_otp = client.post(
        "/auth/verify-otp", json={"phone": "+971501234567", "otp": "000000"}
    )
    assert invalid_otp.status_code == 401
    assert invalid_otp.json() == {"detail": "Invalid verification code"}

    invalid_token = client.get("/me", headers={"Authorization": "Bearer not-a-token"})
    assert invalid_token.status_code == 401
