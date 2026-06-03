import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleCsv = path.join(__dirname, 'fixtures', 'sample.csv');

test.describe('File upload page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows CSV preview after selecting a CSV file', async ({ page }) => {
    await page.setInputFiles('input[type="file"]', sampleCsv);

    await expect(page.locator('.file-selected')).toHaveText('Selected: sample.csv');
    await expect(page.locator('text=CSV Preview')).toBeVisible();
    await expect(page.locator('.preview-table')).toBeVisible();
    await expect(page.locator('.preview-table tbody tr')).toHaveCount(3);
  });

  test('uploads selected file and shows success message', async ({ page }) => {
    await page.route('**/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'File uploaded successfully' }),
      });
    });

    await page.route('**/uploads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, file_name: 'sample.csv', status: 'processing', processed_rows: 0 },
        ]),
      });
    });

    await page.setInputFiles('input[type="file"]', sampleCsv);
    await page.click('button:has-text("Upload File")');

    await expect(page.locator('text=File uploaded successfully ✅')).toBeVisible();
    await expect(page.locator('text=Saved Uploads')).toBeVisible();
    await expect(page.locator('.uploads-section table .download-link')).toHaveCount(1);
  });
});
