"""
ForgeCRM API — Centralized Pricing and Line Item Calculation Engine

Provides canonical financial calculations with exact Decimal precision for
subtotals, percentage discounts, taxes, and deal totals across ForgeCRM.

Documentation: docs/02_Database/207_DEALS_PIPELINES_SCHEMA.md
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


@dataclass(frozen=True)
class LineItemCalculation:
    """Canonical calculation output for a deal line item."""

    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    subtotal: Decimal
    taxable_amount: Decimal
    tax_amount: Decimal
    total: Decimal


def quantize_money(amount: Decimal | float | int | str) -> Decimal:
    """Round monetary values to two decimal places using ROUND_HALF_UP."""
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_line_item(
    quantity: Decimal | float | int | str,
    unit_price: Decimal | float | int | str,
    discount_percent: Decimal | float | int | str = Decimal("0.00"),
    tax_rate: Decimal | float | int | str = Decimal("0.00"),
) -> LineItemCalculation:
    """
    Computes financial breakdown for a single deal line item.

    Rules:
      1. subtotal = quantity * unit_price
      2. discount_amount = subtotal * (discount_percent / 100)
      3. taxable_amount = max(0, subtotal - discount_amount)
      4. tax_amount = taxable_amount * (tax_rate / 100)
      5. total = taxable_amount + tax_amount
    """
    qty = Decimal(str(quantity)) if not isinstance(quantity, Decimal) else quantity
    price = Decimal(str(unit_price)) if not isinstance(unit_price, Decimal) else unit_price
    disc_pct = Decimal(str(discount_percent)) if not isinstance(discount_percent, Decimal) else discount_percent
    tax_pct = Decimal(str(tax_rate)) if not isinstance(tax_rate, Decimal) else tax_rate

    # Enforce non-negative bounds
    if qty <= Decimal("0.00"):
        raise ValueError("Quantity must be greater than 0")
    if price < Decimal("0.00"):
        raise ValueError("Unit price cannot be negative")
    if disc_pct < Decimal("0.00") or disc_pct > Decimal("100.00"):
        raise ValueError("Discount percent must be between 0.00 and 100.00")
    if tax_pct < Decimal("0.00"):
        raise ValueError("Tax rate cannot be negative")

    subtotal = quantize_money(qty * price)
    discount_amount = quantize_money(subtotal * (disc_pct / Decimal("100.00")))
    taxable_amount = quantize_money(max(Decimal("0.00"), subtotal - discount_amount))
    tax_amount = quantize_money(taxable_amount * (tax_pct / Decimal("100.00")))
    total = quantize_money(taxable_amount + tax_amount)

    return LineItemCalculation(
        quantity=qty,
        unit_price=price,
        discount_percent=disc_pct,
        discount_amount=discount_amount,
        tax_rate=tax_pct,
        subtotal=subtotal,
        taxable_amount=taxable_amount,
        tax_amount=tax_amount,
        total=total,
    )


def calculate_deal_totals(
    line_items: list[LineItemCalculation],
) -> tuple[Decimal, Decimal, Decimal, Decimal]:
    """
    Computes aggregated subtotal, discount, tax, and grand total for a deal.

    Returns:
        (total_subtotal, total_discount, total_tax, grand_total)
    """
    total_subtotal = Decimal("0.00")
    total_discount = Decimal("0.00")
    total_tax = Decimal("0.00")
    grand_total = Decimal("0.00")

    for item in line_items:
        total_subtotal += item.subtotal
        total_discount += item.discount_amount
        total_tax += item.tax_amount
        grand_total += item.total

    return (
        quantize_money(total_subtotal),
        quantize_money(total_discount),
        quantize_money(total_tax),
        quantize_money(grand_total),
    )
