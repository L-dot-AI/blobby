import { test, expect } from '@playwright/test';

test.describe('Blobby E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with correct title and elements', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Blobby');
    await expect(page.locator('#apiKey')).toBeVisible();
    await expect(page.locator('.drop-zone')).toBeVisible();
    await expect(page.locator('#pasteText')).toBeVisible();
    await expect(page.locator('button.btn')).toBeVisible();
  });

  test('shows error when submitting without API key', async ({ page }) => {
    await page.locator('#pasteText').fill('Some test text to summarize');
    await page.locator('button.btn').first().click();
    await expect(page.locator('.error')).toContainText('API key');
  });

  test('shows error when submitting without file or text', async ({ page }) => {
    await page.locator('#apiKey').fill('sk-test1234567890abcdefg');
    await page.locator('button.btn').first().click();
    await expect(page.locator('.error')).toContainText('file or text');
  });

  test('API key field masks input', async ({ page }) => {
    const input = page.locator('#apiKey');
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('file drop zone responds to interaction', async ({ page }) => {
    const dropZone = page.locator('.drop-zone');
    await expect(dropZone).toContainText('Drop a file here');
  });

  test('custom prompt field is optional and accepts input', async ({ page }) => {
    const promptInput = page.locator('#prompt');
    await expect(promptInput).toBeVisible();
    await promptInput.fill('Summarize in 3 bullet points');
    await expect(promptInput).toHaveValue('Summarize in 3 bullet points');
  });

  test('paste text flow enables submit button', async ({ page }) => {
    await page.locator('#apiKey').fill('sk-test1234567890abcdefg');
    await page.locator('#pasteText').fill('Here is some sample text for testing.');
    const btn = page.locator('button.btn').first();
    await expect(btn).toBeEnabled();
  });
});
