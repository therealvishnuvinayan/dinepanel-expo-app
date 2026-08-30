from decimal import Decimal
from typing import Annotated

from pydantic import BeforeValidator, PlainSerializer


def _quantized_string(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01')):.2f}"


Money = Annotated[
    Decimal,
    BeforeValidator(Decimal),
    PlainSerializer(_quantized_string, return_type=str, when_used="json"),
]
Percentage = Annotated[
    Decimal,
    BeforeValidator(Decimal),
    PlainSerializer(_quantized_string, return_type=str, when_used="json"),
]
