// Screenshots of the "WOW" layer (journey rail, wayang replay, mascot, final celebration, certificate).
// Usage: dev server on 5173, then: node scripts/shots-wow.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = 'C:/Users/eston/OneDrive/Desktop/VIRTUAL-LAB-ALAT/panduan-bincang';
mkdirSync(out, { recursive: true });
const KEY = 'sci1-germination:v1';
const now = new Date().toISOString();
const tube = (id, materials, extra = {}) => ({ id, materials, location: 'bench', waterAvailable: false, oxygenAvailable: true, temperatureC: 25, validated: true, attempts: 0, hintLevel: 0, placementConfirmed: true, ...extra });
const tubes = {
  A: tube('A', ['seed', 'wetCotton', 'water'], { waterAvailable: true }),
  B: tube('B', ['seed', 'dryCotton']),
  C: tube('C', ['seed', 'wetCotton', 'cooledBoiledWater', 'oil'], { waterAvailable: true, oxygenAvailable: false }),
  D: tube('D', ['seed', 'wetCotton', 'water'], { waterAvailable: true, temperatureC: 5 }),
};
const base = { id: 'shot', mode: 'individual', name: 'Aina', className: '1 Bestari', members: [], roleRotation: 0, turnIndex: 0, createdAt: now, updatedAt: now, completedSteps: [0, 1, 2, 3, 4, 5, 6, 7], hypothesis: 1, prediction: ['A'], predictionMade: true, tubes, day: 5, maxDay: 5, experimentStartedAt: now, observations: { A: true, B: false, C: false, D: false }, results: {}, explanationAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' }, analysisFirstAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' }, conclusion: ['AIR', 'OKSIGEN', 'SUHU'], conclusionChecked: true, hintsUsed: 0, resultsCheck: { correct: 16, total: 16 }, scores: { hypothesis: 2, setup: 8, observation: 4, results: 8, analysis: 4, conclusion: 4, bonus: 0 } };

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
const page = await context.newPage();
const seed = async (session) => {
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(([key, s]) => localStorage.setItem(key, JSON.stringify({ version: 1, session: s, soundEnabled: false, settings: { hintsEnabled: true, scoreEnabled: true, allowedModes: 'both', maxMembers: 5, discussionCountdown: true }, classRecords: [], teacherPin: '1234' })), [KEY, session]);
  await page.reload({ waitUntil: 'domcontentloaded' });
};

// 10: simulation day 5 — journey rail + wayang replay button.
await seed({ ...base, screen: 'simulation', completedAt: undefined, resultCode: undefined });
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/10-rel-wayang.png' });

// 11: fresh hypothesis screen — Cik Biji mascot bubble.
await seed({ ...base, screen: 'hypothesis', completedSteps: [0], day: 1, maxDay: 1, experimentStartedAt: undefined, completedAt: undefined, resultCode: undefined });
await page.locator('.seed-mascot-bubble').waitFor({ timeout: 5000 });
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/11-cik-biji.png' });

// 12 + 13: final screen with confetti and badges, then the certificate.
await seed({ ...base, screen: 'final', completedAt: now, resultCode: 'SCI1-GERM-SHOT123' });
await page.locator('#confetti-layer .confetti-piece').first().waitFor({ timeout: 5000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: out + '/12-tamat-lencana.png' });
const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Cetak sijil' }).click();
const cert = await popupPromise;
await cert.waitForLoadState('domcontentloaded');
await cert.setViewportSize({ width: 1100, height: 800 });
await cert.screenshot({ path: out + '/13-sijil.png' });
await cert.close();

console.log('OK ->', out);
await browser.close();
