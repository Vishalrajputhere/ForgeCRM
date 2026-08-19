/**
 * E2E Test: Authentication Flow
 *
 * Covers:
 *   - Login page renders correctly
 *   - Successful login navigates to dashboard
 *   - Invalid credentials shows error
 *   - Logout clears session and redirects to login
 */

import { test, expect } from '@playwright/test';

const VALID_EMAIL = 'admin@forgecrm.io';
const VALID_PASSWORD = 'ForgeCRM_Dev_2024!';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Always start from the login page (unauthenticated)
    await page.goto('/login');
  });

  test('login page renders key elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.getByLabel(/email/i).fill(VALID_EMAIL);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Should land on dashboard or workspace selection
    await page.waitForURL(/\/(dashboard|workspaces|$)/, { timeout: 15_000 });
    expect(page.url()).not.toContain('/login');
  });

  test('invalid credentials shows an error message', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Error message should appear
    await expect(
      page.getByText(/invalid|incorrect|credentials|unauthorized/i)
    ).toBeVisible({ timeout: 8_000 });

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.getByLabel(/email/i).fill(VALID_EMAIL);
    await page.getByLabel(/password/i).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/(dashboard|workspaces)/, { timeout: 15_000 });

    // Trigger logout via user menu
    const userMenuTrigger = page.getByRole('button', { name: /account|profile|user menu/i })
      .or(page.locator('[data-testid="user-menu-trigger"]'))
      .first();
    await userMenuTrigger.click();
    await page.getByRole('menuitem', { name: /sign out|log out/i }).click();

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
