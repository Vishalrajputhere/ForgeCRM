/**
 * E2E Test: RBAC — Viewer Role Restrictions
 *
 * A Viewer role user should:
 *   - See the dashboard and read-only data
 *   - NOT see "Create" / "New" / "Add" action buttons on CRM entity pages
 *   - NOT be able to navigate to settings/member management pages
 *   - See 403 or permission-denied UI if they try restricted actions
 */

import { test, expect } from '@playwright/test';

// These credentials must exist in the seeded dev DB as a Viewer role member
const VIEWER_EMAIL = 'viewer@forgecrm.io';
const VIEWER_PASSWORD = 'ForgeCRM_Viewer_2024!';

test.describe('RBAC — Viewer Role Restrictions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as viewer
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(VIEWER_EMAIL);
    await page.getByLabel(/password/i).fill(VIEWER_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 15_000 });
  });

  test('viewer cannot see "New Lead" create button on leads page', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');

    // Create buttons should not be present for viewer
    const createButton = page.getByRole('button', { name: /new lead|add lead|create lead/i });
    await expect(createButton).not.toBeVisible();
  });

  test('viewer cannot see "New Deal" button on deals page', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /new deal|add deal|create deal/i });
    await expect(createButton).not.toBeVisible();
  });

  test('viewer cannot see "New Company" button on companies page', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /new company|add company|create company/i });
    await expect(createButton).not.toBeVisible();
  });

  test('viewer cannot access workspace settings member management', async ({ page }) => {
    await page.goto('/settings/members');
    await page.waitForLoadState('networkidle');

    // Either a 403 page or no "Invite Member" button should appear
    const isAccessDenied =
      (await page.getByText(/access denied|forbidden|permission/i).count()) > 0 ||
      (await page.getByRole('button', { name: /invite|add member/i }).count()) === 0;

    expect(isAccessDenied).toBe(true);
  });

  test('viewer can read companies list without errors', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('networkidle');

    // Page should load without error state
    const errorMessage = page.getByText(/something went wrong|failed to load|500/i);
    await expect(errorMessage).not.toBeVisible();
  });
});
