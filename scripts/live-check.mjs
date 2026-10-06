// Live verification for the deployed Virtual Lab (GitHub Pages).
// Usage: node scripts/live-check.mjs                        (expects PIN 1234)
//        VLAB_PIN=919293 node scripts/live-check.mjs        (when a baked lock is active)
// NOTE: keep this in scripts/ — Playwright wipes test-results/ on every run.
import { chromium } from '@playwright/test';

const url = 'https://wriizo212.github.io/virtual-lab-s1/';
const PIN = process.env.VLAB_PIN || '1234';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 950 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push('pageerror: ' + String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.getByRole('heading', { name: /Satu biji benih/ }).waitFor({ timeout: 45000 });
const offlineReady = await page.getByText('Aplikasi tersedia offline').waitFor({ timeout: 45000 }).then(() => true).catch(() => false);
const swRegistrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
await page.screenshot({ path: 'test-results/live-landing.png' });

// Teacher mode: unlock with the given PIN. If a baked lock rejects it,
// report the state and continue with the public checks below.
let teacher = { locked: true };
await page.getByRole('button', { name: 'Guru', exact: true }).click();
await page.getByLabel('PIN guru', { exact: true }).fill(PIN);
await page.getByRole('button', { name: 'Buka mod guru' }).click();
const unlocked = await page.getByRole('button', { name: 'Tukar PIN guru' }).waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
if (unlocked) {
  const discussFeature = await page.getByRole('button', { name: 'Bincang bersama kelas' }).isVisible().catch(() => false);
  await page.getByRole('button', { name: 'Ringkasan kelas' }).click();
  await page.getByLabel('Kod kelas murid').fill('SCI1-KELAS-MXwxIEJlc3Rhcml8QWluYXxJfDMwfDB8NHwwfDE3OTEyNTEzNjk.d4');
  await page.getByRole('button', { name: 'Import kod' }).click();
  const importMessage = await page.locator('.class-summary [role=status]').textContent().catch(() => null);
  const rows = await page.locator('.class-summary tbody tr').count();
  const storedRecords = await page.evaluate(() => JSON.parse(localStorage.getItem('sci1-germination:v1')).classRecords.length);
  await page.screenshot({ path: 'test-results/live-teacher.png' });
  teacher = { locked: false, discussFeature, importMessage, rows, storedRecords };
  await page.getByRole('button', { name: 'Tutup mod guru' }).click();
} else {
  await page.getByRole('button', { name: 'Tutup mod guru' }).click();
}

// Guide page should load and carry the link + QR.
const guide = await context.newPage();
await guide.goto(url + 'panduan-kelas.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
const guideTitle = await guide.title();
const guideQr = await guide.locator('.qr-box svg').count();
await guide.screenshot({ path: 'test-results/live-panduan.png', fullPage: true });
await guide.close();

// Offline proof: kill the network, reload, and confirm the cached app still runs.
await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
const offlineRuns = await page.getByText(/Anda sedang offline/).waitFor({ timeout: 30000 }).then(() => true).catch(() => false);
const headingOffline = await page.getByRole('heading', { name: /Satu biji benih/ }).isVisible().catch(() => false);
await context.setOffline(false);

console.log(JSON.stringify({ url, title: await page.title(), offlineReady, swRegistrations, teacher, guideTitle, guideQr, offlineRuns, headingOffline, errors }, null, 2));
await browser.close();
