// One-off: screenshots of the current help (M48 mockup). Copied to journal/assets.
import { test } from '@playwright/test';
import { openApp } from './support';

const out = '../../../journal/assets/2026-11-02-manual-toc-';
test.use({ locale: 'ko-KR', viewport: { width: 1100, height: 640 } });

test('shots', async ({ page }) => {
  await openApp(page);
  await page.getByRole('menubar').getByText('도움말', { exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}now-help-menu.png` });
  await page.keyboard.press('Escape');
  await page.locator('.ans-canvas[tabindex]').focus();
  await page.keyboard.press('Shift+Slash');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}now-shortcuts.png` });
});
