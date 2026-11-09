// The check mode (`?perf`, 06-web 9): the page a person opens on the reference device to measure
// AT-05. It makes the document of 500 blocks itself, times the commands as T-0007 does, and leaves
// the user's data alone.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

import { canvas, openApp } from './support';

/** Everything this site keeps in the browser: localStorage and every IndexedDB store. */
async function browserData(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const stores: Record<string, unknown> = {};
    for (const info of await indexedDB.databases()) {
      const name = info.name ?? '';
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => {
          reject(new Error(`could not open ${name}`));
        };
      });
      for (const store of db.objectStoreNames) {
        stores[`${name}/${store}`] = await new Promise((resolve) => {
          const request = db.transaction(store).objectStore(store).getAll();
          request.onsuccess = () => {
            resolve(request.result);
          };
        });
      }
      db.close();
    }
    const local: Record<string, string | null> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) ?? '';
      local[key] = localStorage.getItem(key);
    }
    return JSON.stringify({ local, stores });
  });
}

/** Opens the check mode, starts it and waits for the result table. */
async function measure(page: Page, search: string): Promise<void> {
  await page.goto(`./?perf&${search}`);
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: 'Start Measuring' }).click();
  await expect(page.locator('.ans-perf-verdict')).toBeVisible({ timeout: 60_000 });
}

/** The median of a command in the result table, in ms. */
async function median(page: Page, command: string): Promise<number> {
  return Number(await page.locator(`tr[data-command="${command}"] td`).nth(2).textContent());
}

const commands = ['insert', 'delete', 'undo', 'redo', 'wrap', 'move', 'paste', 'text'];

test('T-1127 · AT-05: the check mode times every command and leaves the local backup and settings alone', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // A user's own document, kept in the local backup.
  await openApp(page);
  await canvas(page).press('Enter');
  await page.keyboard.type('mine');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await browserData(page)).includes('mine')).toBe(true);
  const before = await browserData(page);

  // A small document and one run per place: this test checks the page, not the time, and runs
  // while the coverage is recorded, next to tests that time the start.
  await measure(page, 'rounds=1&blocks=12');
  await expect(page.locator('tr[data-command]')).toHaveCount(commands.length);
  for (const command of commands) {
    expect(await median(page, command)).toBeGreaterThan(0);
  }
  // The measured document is thrown away: the editor shows an empty one again.
  await expect(page.locator('.ans-document text').filter({ hasText: /^step 6$/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Copy Results' }).click();
  await expect(page.getByText('Copied the results as a Markdown table.')).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('## Check mode: edit response time (AT-05)');
  expect(copied).toContain('| Insert a process block | `o` |');
  expect(await browserData(page)).toBe(before);

  // The app still has the user's document. In a new tab, so this page's coverage is kept.
  const app = await context.newPage();
  await app.goto('./');
  await app.getByRole('dialog').getByRole('button', { name: 'Restore' }).click();
  await expect(app.locator('.ans-document text').filter({ hasText: 'mine' })).toBeVisible();
});

test('T-1128 · AT-05: the check mode measures what T-0007 measures, within 100 ms here', async ({
  page,
}) => {
  // Recording the coverage slows the page down: the time is measured by `pnpm e2e` only.
  test.skip(process.env.E2E_COVERAGE !== undefined, 'coverage recording slows the page down');
  await measure(page, 'rounds=3');
  // T-0007's bar: the median of an insert in the middle of 500 blocks is under 100 ms.
  for (const command of commands) {
    expect(await median(page, command)).toBeLessThan(100);
  }
});
