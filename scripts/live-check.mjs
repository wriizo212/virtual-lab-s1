// Live verification for the deployed Virtual Lab (GitHub Pages).
// Usage: node scripts/live-check.mjs
// NOTE: keep this in scripts/ — Playwright wipes test-results/ on every run.
import { chromium } from '@playwright/test';

const url = 'https://wriizo212.github.io/virtual-lab-s1/';
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

// Teacher mode: import a prepared class code and confirm the summary table works live.
await page.getByRole('button', { name: 'Guru', exact: true }).click();
await page.getByLabel('PIN guru', { exact: true }).fill('1234');
await page.getByRole('button', { name: 'Buka mod guru' }).click();
await page.getByRole('button', { name: 'Ringkasan kelas' }).click();
await page.getByLabel('Kod kelas murid').fill('SCI1-KELAS-MXwxIEJlc3Rhcml8QWluYXxJfDMwfDB8NHwwfDE3OTEyNTEzNjk.d4');
await page.getByRole('button', { name: 'Import kod' }).click();
const importMessage = await page.locator('.class-summary [role=status]').textContent().catch(() => null);
const rows = await page.locator('.class-summary tbody tr').count();
const storedRecords = await page.evaluate(() => JSON.parse(localStorage.getItem('sci1-germination:v1')).classRecords.length);
const pinFeature = await page.getByRole('button', { name: 'Tukar PIN guru' }).isVisible().catch(() => false);
await page.screenshot({ path: 'test-results/live-teacher.png' });
await page.getByRole('button', { name: 'Tutup mod guru' }).click();

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

console.log(JSON.stringify({ url, title: await page.title(), offlineReady, swRegistrations, importMessage, rows, storedRecords, pinFeature, guideTitle, guideQr, offlineRuns, headingOffline, errors }, null, 2));
await browser.close();
