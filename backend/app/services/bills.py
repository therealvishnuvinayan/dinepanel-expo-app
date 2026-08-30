import re
import secrets
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Bill, BillStatus, Restaurant
from app.services.rewards import calculate_reward, quantize_money


def _bill_prefix(restaurant_name: str) -> str:
    words = re.findall(r"[A-Za-z0-9]+", restaurant_name)
    if len(words) >= 2:
        return "".join(word[0] for word in words[:2]).upper()
    return (words[0][:2] if words else "DP").upper()


def create_demo_bill(db: Session, restaurant: Restaurant, amount: Decimal) -> Bill:
    bill = Bill(
        restaurant_id=restaurant.id,
        bill_number=f"{_bill_prefix(restaurant.name)}-{secrets.token_hex(4).upper()}",
        amount=quantize_money(amount),
        bill_date=date.today(),
        status=BillStatus.CLAIMABLE,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


def reward_preview(bill: Bill, restaurant: Restaurant) -> Decimal:
    return calculate_reward(bill.amount, restaurant.reward_percentage)
