// Screenshot the new "Bincang bersama kelas" flow on the dev server.
// Usage: npx vite (port 5173, .env.local moved aside) then: node scripts/shots-bincang.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'C:/Users/eston/OneDrive/Desktop/VIRTUAL-LAB-ALAT/panduan-bincang';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

await page.getByRole('button', { name: 'Guru', exact: true }).click();
await page.getByLabel('PIN guru', { exact: true }).fill('1234');
await page.getByRole('button', { name: 'Buka mod guru' }).click();
const discussBtn = page.getByRole('button', { name: 'Bincang bersama kelas' });
await discussBtn.waitFor();

// Shot 1: teacher mode with a red box around the new button.
const box = await discussBtn.boundingBox();
await page.evaluate(({ x, y, width, height }) => {
  const d = document.createElement('div');
  d.id = 'hermes-annot';
  d.style.cssText = `position:fixed;left:${x - 8}px;top:${y - 8}px;width:${width + 16}px;height:${height + 16}px;border:3px solid #e02020;border-radius:12px;z-index:99999;pointer-events:none;box-shadow:0 0 0 3px rgba(255,255,255,.85)`;
  document.body.appendChild(d);
}, box);
await page.screenshot({ path: out + '/1-butang-bincang.png' });
await page.evaluate(() => document.getElementById('hermes-annot')?.remove());

await discussBtn.click();
await page.getByRole('button', { name: 'Seterusnya' }).click();
await page.getByRole('button', { name: 'Tunjuk jawapan' }).click();
await page.screenshot({ path: out + '/2-slide-hipotesis.png' });

await page.getByRole('button', { name: 'Seterusnya' }).click();
await page.getByRole('button', { name: 'Seterusnya' }).click();
await page.screenshot({ path: out + '/3-slide-jadual.png' });

await page.getByRole('button', { name: 'Seterusnya' }).click();
await page.getByRole('button', { name: 'Tunjuk jawapan' }).click();
await page.screenshot({ path: out + '/4-soalan-jawapan.png' });

for (let i = 0; i < 7; i++) await page.getByRole('button', { name: /Seterusnya|Tunjuk jawapan/ }).click();
await page.screenshot({ path: out + '/5-kesimpulan.png' });

console.log('OK ->', out);
await browser.close();
