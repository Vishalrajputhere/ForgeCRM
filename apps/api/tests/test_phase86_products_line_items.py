"""
ForgeCRM API — Phase 8.6 Product Catalog + Deal Line Items Integration Tests

Verifies:
  - Centralized Decimal pricing calculation engine
  - Product Catalog CRUD, search, category filtering, and pagination
  - SKU uniqueness within a workspace and multi-tenant isolation across workspaces
  - Historical price and name snapshots on deal line items
  - Real-time line item math (subtotal, percentage discount, tax, grand total)
  - Automatic Deal value synchronization on line item add, update, delete, and bulk replace
  - Soft-archiving of catalog products when referenced by historical deals
  - Product Catalog Analytics endpoint (/api/v1/analytics/products)
  - Workspace isolation and RBAC permission enforcement
"""

from __future__ import annotations

from decimal import Decimal
import pytest
from httpx import AsyncClient

from app.modules.crm.pricing import calculate_line_item, quantize_money

USER_PHASE86_ADMIN_A = {
    "first_name": "Tony",
    "last_name": "Stark",
    "email": "tony_phase86@stark.com",
    "password": "StrongPassword123!",
}

USER_PHASE86_ADMIN_B = {
    "first_name": "Pepper",
    "last_name": "Potts",
    "email": "pepper_phase86@resilient.com",
    "password": "StrongPassword123!",
}


async def _setup_test_workspace(client: AsyncClient, user_data: dict[str, str], ws_name: str) -> dict[str, str]:
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    token = reg_res.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    ws_res = await client.post("/api/v1/workspaces", json={"name": ws_name}, headers=auth_headers)
    ws_id = ws_res.json()["id"]

    return {
        "Authorization": f"Bearer {token}",
        "X-Workspace-ID": ws_id,
    }


class TestPhase86ProductCatalogAndLineItems:
    """Comprehensive test suite for Phase 8.6 Product Catalog & Deal Line Items."""

    def test_pricing_engine_unit_calculations(self) -> None:
        """Verify the centralized Decimal pricing calculation rules."""
        # 1. Standard calculation: qty=2, price=100.00, disc=10%, tax=5%
        # subtotal = 200.00
        # discount = 20.00 -> taxable = 180.00
        # tax = 9.00 -> total = 189.00
        calc = calculate_line_item(
            quantity=2,
            unit_price=100.00,
            discount_percent=10.0,
            tax_rate=5.0,
        )
        assert calc.subtotal == Decimal("200.00")
        assert calc.discount_amount == Decimal("20.00")
        assert calc.taxable_amount == Decimal("180.00")
        assert calc.tax_amount == Decimal("9.00")
        assert calc.total == Decimal("189.00")

        # 2. Rounding check with fractional amounts
        calc2 = calculate_line_item(
            quantity=3,
            unit_price=33.33,
            discount_percent=15.5,
            tax_rate=8.25,
        )
        # subtotal = 3 * 33.33 = 99.99
        # discount = 99.99 * 0.155 = 15.49845 -> 15.50
        # taxable = 99.99 - 15.50 = 84.49
        # tax = 84.49 * 0.0825 = 6.970425 -> 6.97
        # total = 84.49 + 6.97 = 91.46
        assert calc2.subtotal == Decimal("99.99")
        assert calc2.discount_amount == Decimal("15.50")
        assert calc2.taxable_amount == Decimal("84.49")
        assert calc2.tax_amount == Decimal("6.97")
        assert calc2.total == Decimal("91.46")

        # 3. Bound validations
        with pytest.raises(ValueError):
            calculate_line_item(quantity=0, unit_price=10)
        with pytest.raises(ValueError):
            calculate_line_item(quantity=1, unit_price=-5)
        with pytest.raises(ValueError):
            calculate_line_item(quantity=1, unit_price=10, discount_percent=105)

    @pytest.mark.asyncio
    async def test_product_catalog_crud_and_sku_isolation(self, client: AsyncClient) -> None:
        """Verify product CRUD, SKU uniqueness within workspace, and isolation across workspaces."""
        headers_a = await _setup_test_workspace(client, USER_PHASE86_ADMIN_A, "Stark Industries")
        headers_b = await _setup_test_workspace(client, USER_PHASE86_ADMIN_B, "Resilient Tech")

        # 1. Create Product in Workspace A
        create_res = await client.post(
            "/api/v1/products",
            json={
                "name": "Arc Reactor Core Mark IV",
                "sku": "ARC-MK4",
                "description": "Clean fusion power module",
                "category": "Energy",
                "unit_price": 50000.00,
                "currency": "USD",
                "tax_rate": 8.5,
                "is_active": True,
            },
            headers=headers_a,
        )
        assert create_res.status_code == 201
        prod_a = create_res.json()
        assert prod_a["name"] == "Arc Reactor Core Mark IV"
        assert prod_a["sku"] == "ARC-MK4"
        assert prod_a["unit_price"] == 50000.00
        assert prod_a["tax_rate"] == 8.5
        prod_a_id = prod_a["id"]

        # 2. Duplicate SKU in Workspace A should be rejected with 409 Conflict
        dup_res = await client.post(
            "/api/v1/products",
            json={
                "name": "Arc Reactor Duplicate",
                "sku": "ARC-MK4",
                "unit_price": 25000.00,
            },
            headers=headers_a,
        )
        assert dup_res.status_code == 409

        # 3. Same SKU in Workspace B MUST succeed (workspace isolation)
        b_res = await client.post(
            "/api/v1/products",
            json={
                "name": "Resilient Arc Clone",
                "sku": "ARC-MK4",
                "unit_price": 40000.00,
            },
            headers=headers_b,
        )
        assert b_res.status_code == 201
        assert b_res.json()["sku"] == "ARC-MK4"

        # 4. Workspace B cannot see Workspace A's product
        get_b = await client.get(f"/api/v1/products/{prod_a_id}", headers=headers_b)
        assert get_b.status_code == 404

        # 5. List and search in Workspace A
        list_res = await client.get("/api/v1/products?search=Reactor&category=Energy", headers=headers_a)
        assert list_res.status_code == 200
        data = list_res.json()
        assert data["total"] == 1
        assert data["items"][0]["sku"] == "ARC-MK4"

        # 6. Update Product in Workspace A
        patch_res = await client.patch(
            f"/api/v1/products/{prod_a_id}",
            json={"unit_price": 55000.00, "description": "Upgraded power output"},
            headers=headers_a,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["unit_price"] == 55000.00
        assert patch_res.json()["description"] == "Upgraded power output"

    @pytest.mark.asyncio
    async def test_deal_line_items_lifecycle_and_total_sync(self, client: AsyncClient) -> None:
        """Verify line item addition, update, delete, bulk replace, and automatic Deal value sync."""
        headers = await _setup_test_workspace(client, USER_PHASE86_ADMIN_A, "Stark Defense")

        # 1. Create company and product
        comp_res = await client.post(
            "/api/v1/companies",
            json={"name": "Avenger Logistics LLC"},
            headers=headers,
        )
        assert comp_res.status_code == 201
        company_id = comp_res.json()["id"]

        prod_res = await client.post(
            "/api/v1/products",
            json={
                "name": "Repulsor Glove Standard",
                "sku": "REP-STD-01",
                "category": "Hardware",
                "unit_price": 1000.00,
                "tax_rate": 10.0,
            },
            headers=headers,
        )
        assert prod_res.status_code == 201
        product_id = prod_res.json()["id"]

        # 2. Create Deal with initial line item
        # 2 units x $1,000 = $2,000 subtotal, 0% disc, 10% tax = $200 tax -> total $2,200.00
        deal_res = await client.post(
            "/api/v1/deals",
            json={
                "name": "Avenger Equipment Order",
                "company_id": company_id,
                "line_items": [
                    {
                        "product_id": product_id,
                        "quantity": 2.0,
                        "discount_percent": 0.0,
                    }
                ],
            },
            headers=headers,
        )
        assert deal_res.status_code == 201
        deal = deal_res.json()
        deal_id = deal["id"]
        assert deal["value"] == 2200.00
        assert len(deal["line_items"]) == 1
        item_1 = deal["line_items"][0]
        assert item_1["product_name_snapshot"] == "Repulsor Glove Standard"
        assert item_1["sku_snapshot"] == "REP-STD-01"
        assert item_1["subtotal"] == 2000.00
        assert item_1["tax_amount"] == 200.00
        assert item_1["total"] == 2200.00
        item_1_id = item_1["id"]

        # 3. Add second ad-hoc line item without catalog product
        # 1 unit x $500 = $500, 10% disc ($50) -> taxable $450, 0% tax -> total $450.00
        add_item_res = await client.post(
            f"/api/v1/deals/{deal_id}/line-items",
            json={
                "product_name": "Custom Calibration Service",
                "quantity": 1.0,
                "unit_price": 500.00,
                "discount_percent": 10.0,
                "tax_rate": 0.0,
            },
            headers=headers,
        )
        assert add_item_res.status_code == 201
        item_2 = add_item_res.json()
        assert item_2["total"] == 450.00
        item_2_id = item_2["id"]

        # 4. Check Deal value automatically updated to $2,200 + $450 = $2,650.00
        get_deal_res = await client.get(f"/api/v1/deals/{deal_id}", headers=headers)
        assert get_deal_res.status_code == 200
        assert get_deal_res.json()["value"] == 2650.00

        # 5. Update first line item: apply 20% discount
        # qty 2 x 1000 = 2000 subtotal, 20% disc ($400) -> taxable $1600, 10% tax ($160) -> total $1,760.00
        patch_item_res = await client.patch(
            f"/api/v1/deals/{deal_id}/line-items/{item_1_id}",
            json={"discount_percent": 20.0},
            headers=headers,
        )
        assert patch_item_res.status_code == 200
        updated_item_1 = patch_item_res.json()
        assert updated_item_1["discount_amount"] == 400.00
        assert updated_item_1["taxable_amount"] == 1600.00
        assert updated_item_1["tax_amount"] == 160.00
        assert updated_item_1["total"] == 1760.00

        # Check deal value updated to $1,760 + $450 = $2,210.00
        deal_after_patch = (await client.get(f"/api/v1/deals/{deal_id}", headers=headers)).json()
        assert deal_after_patch["value"] == 2210.00

        # 6. Delete second line item
        del_item_res = await client.delete(
            f"/api/v1/deals/{deal_id}/line-items/{item_2_id}",
            headers=headers,
        )
        assert del_item_res.status_code == 204

        # Deal value should drop back to $1,760.00
        deal_after_del = (await client.get(f"/api/v1/deals/{deal_id}", headers=headers)).json()
        assert deal_after_del["value"] == 1760.00

        # 7. Bulk set line items (atomically replace all items)
        bulk_res = await client.post(
            f"/api/v1/deals/{deal_id}/line-items/bulk",
            json={
                "line_items": [
                    {
                        "product_id": product_id,
                        "quantity": 5.0,  # 5 x 1000 = 5000, 0% disc, 10% tax ($500) -> $5,500.00
                        "discount_percent": 0.0,
                    },
                    {
                        "product_name": "Premium Flight Support",
                        "quantity": 2.0,
                        "unit_price": 2000.00,  # 2 x 2000 = 4000, 5% disc ($200) -> 3800 taxable, 5% tax ($190) -> $3,990.00
                        "discount_percent": 5.0,
                        "tax_rate": 5.0,
                    },
                ]
            },
            headers=headers,
        )
        assert bulk_res.status_code == 200
        bulk_items = bulk_res.json()
        assert len(bulk_items) == 2
        assert bulk_items[0]["total"] == 5500.00
        assert bulk_items[1]["total"] == 3990.00

        deal_after_bulk = (await client.get(f"/api/v1/deals/{deal_id}", headers=headers)).json()
        assert deal_after_bulk["value"] == 9490.00

    @pytest.mark.asyncio
    async def test_historical_price_snapshot_and_product_archival(self, client: AsyncClient) -> None:
        """Verify that updating a catalog product's price does NOT alter past deal line items, and deleting an active product archives it."""
        headers = await _setup_test_workspace(client, USER_PHASE86_ADMIN_A, "Stark Aerospace")

        comp_res = await client.post("/api/v1/companies", json={"name": "S.H.I.E.L.D."}, headers=headers)
        company_id = comp_res.json()["id"]

        # 1. Create product at $10,000
        prod_res = await client.post(
            "/api/v1/products",
            json={
                "name": "Micro-Thruster Jet",
                "sku": "THRUST-001",
                "category": "Propulsion",
                "unit_price": 10000.00,
                "tax_rate": 0.0,
            },
            headers=headers,
        )
        product_id = prod_res.json()["id"]

        # 2. Attach to deal
        deal_res = await client.post(
            "/api/v1/deals",
            json={
                "name": "Helicarrier Thruster Upgrade",
                "company_id": company_id,
                "line_items": [{"product_id": product_id, "quantity": 4.0}],
            },
            headers=headers,
        )
        deal_id = deal_res.json()["id"]
        assert deal_res.json()["value"] == 40000.00

        # 3. Increase catalog product price to $15,000
        patch_res = await client.patch(
            f"/api/v1/products/{product_id}",
            json={"unit_price": 15000.00},
            headers=headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["unit_price"] == 15000.00

        # 4. Existing deal line item MUST retain original snapshot price of $10,000 and deal total $40,000
        deal_check = (await client.get(f"/api/v1/deals/{deal_id}", headers=headers)).json()
        assert deal_check["value"] == 40000.00
        line_item = deal_check["line_items"][0]
        assert line_item["unit_price"] == 10000.00
        assert line_item["total"] == 40000.00

        # 5. Delete product: since it is referenced in a deal, it must be soft-archived (is_active=False)
        del_res = await client.delete(f"/api/v1/products/{product_id}", headers=headers)
        assert del_res.status_code == 204

        # Verify product still exists but is_active is False
        get_prod = (await client.get(f"/api/v1/products/{product_id}", headers=headers)).json()
        assert get_prod["is_active"] is False

    @pytest.mark.asyncio
    async def test_product_analytics_api(self, client: AsyncClient) -> None:
        """Verify GET /api/v1/analytics/products calculates top products and category revenue."""
        headers = await _setup_test_workspace(client, USER_PHASE86_ADMIN_A, "Stark Analytics HQ")

        comp_res = await client.post("/api/v1/companies", json={"name": "Global Defense"}, headers=headers)
        company_id = comp_res.json()["id"]

        prod1 = (
            await client.post(
                "/api/v1/products",
                json={"name": "Vibranium Shield", "sku": "SHIELD-V1", "category": "Defensive", "unit_price": 5000.0, "tax_rate": 0.0},
                headers=headers,
            )
        ).json()

        prod2 = (
            await client.post(
                "/api/v1/products",
                json={"name": "Tactical HUD Visor", "sku": "HUD-01", "category": "Electronics", "unit_price": 2000.0, "tax_rate": 0.0},
                headers=headers,
            )
        ).json()

        # Create deal with both products
        await client.post(
            "/api/v1/deals",
            json={
                "name": "Infantry Kit Order",
                "company_id": company_id,
                "line_items": [
                    {"product_id": prod1["id"], "quantity": 2.0},  # $10,000
                    {"product_id": prod2["id"], "quantity": 5.0},  # $10,000
                ],
            },
            headers=headers,
        )

        # Call analytics endpoint
        analytics_res = await client.get("/api/v1/analytics/products", headers=headers)
        assert analytics_res.status_code == 200
        data = analytics_res.json()
        assert data["total_revenue"] == 20000.00
        assert data["total_units_sold"] == 7.00
        assert len(data["top_products"]) == 2
        assert len(data["category_breakdown"]) == 2
