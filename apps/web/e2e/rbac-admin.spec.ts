/**
 * E2E Test: RBAC — Workspace Admin Capabilities
 *
 * A Workspace Admin should:
 *   - See all Create / Edit / Delete buttons
 *   - Be able to access Settings → Members page
 *   - Be able to see the Invite Member button
 *   - Be able to access automation rules
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@forgecrm.io';
const ADMIN_PASSWORD = 'ForgeCRM_Dev_2024!';

test.describe('RBAC — Workspace Admin Capabilities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 15_000 });
  });

  test('admin can see "New Lead" create button on leads page', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /new lead|add lead|create lead/i });
    await expect(createButton).toBeVisible({ timeout: 8_000 });
  });

  test('admin can access Settings → Members page', async ({ page }) => {
    await page.goto('/settings/members');
    await page.waitForLoadState('networkidle');

    // Should see the Invite Member button
    const inviteButton = page.getByRole('button', { name: /invite|add member/i });
    await expect(inviteButton).toBeVisible({ timeout: 8_000 });
  });

  test('admin can access automation rules page', async ({ page }) => {
    await page.goto('/automations');
    await page.waitForLoadState('networkidle');

    // Page loads without error
    const errorMessage = page.getByText(/something went wrong|failed to load|500/i);
    await expect(errorMessage).not.toBeVisible();
  });

  test('admin can see pipeline management options on deals page', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /new deal|add deal|create deal/i });
    await expect(createButton).toBeVisible({ timeout: 8_000 });
  });

  test('admin can access analytics dashboard', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Analytics page should render KPI cards or charts
    const errorMessage = page.getByText(/something went wrong|failed to load|500/i);
    await expect(errorMessage).not.toBeVisible();
  });
});
