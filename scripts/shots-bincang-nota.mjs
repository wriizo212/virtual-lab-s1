// Screenshots of the new teacher tools (notes, misconceptions, reference sheet).
// Usage: dev server on 5173 (with .env.local moved aside), then: node scripts/shots-bincang-nota.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'C:/Users/eston/OneDrive/Desktop/VIRTUAL-LAB-ALAT/panduan-bincang';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 950 } });
const page = await context.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

await page.getByRole('button', { name: 'Guru', exact: true }).click();
await page.getByLabel('PIN guru', { exact: true }).fill('1234');
await page.getByRole('button', { name: 'Buka mod guru' }).click();

// Shot 6: teacher mode with a red box around the new "Cetak helaian rujukan" button.
const sheetBtn = page.getByRole('button', { name: 'Cetak helaian rujukan' });
const box = await sheetBtn.boundingBox();
await page.evaluate(({ x, y, width, height }) => {
  const d = document.createElement('div');
  d.id = 'hermes-annot';
  d.style.cssText = `position:fixed;left:${x - 8}px;top:${y - 8}px;width:${width + 16}px;height:${height + 16}px;border:3px solid #e02020;border-radius:12px;z-index:99999;pointer-events:none;box-shadow:0 0 0 3px rgba(255,255,255,.85)`;
  document.body.appendChild(d);
}, box);
await page.screenshot({ path: out + '/6-butang-helaian.png' });
await page.evaluate(() => document.getElementById('hermes-annot')?.remove());

// Shot 9: the printable reference sheet (full page).
const popupPromise = page.waitForEvent('popup');
await sheetBtn.click();
const sheet = await popupPromise;
await sheet.waitForLoadState('domcontentloaded');
await sheet.setViewportSize({ width: 1050, height: 1300 });
await sheet.screenshot({ path: out + '/9-helaian-rujukan.png', fullPage: true });
await sheet.close();

// Shots 7 & 8: teacher notes bar and the misconceptions slide.
await page.getByRole('button', { name: 'Bincang bersama kelas' }).click();
await page.getByRole('button', { name: 'Nota guru' }).click();
await page.screenshot({ path: out + '/7-nota-guru.png' });
await page.getByRole('button', { name: 'Nota guru' }).click();
await page.getByRole('button', { name: 'Seterusnya' }).click();
await page.getByRole('button', { name: 'Tunjuk jawapan' }).click();
for (let i = 0; i < 11; i++) await page.getByRole('button', { name: /Seterusnya|Tunjuk jawapan/ }).click();
await page.screenshot({ path: out + '/8-salah-faham.png' });

console.log('OK ->', out);
await browser.close();
