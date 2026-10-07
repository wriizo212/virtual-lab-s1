import { test, expect, type Page } from '@playwright/test';
import { createSession, type Session } from '../src/domain/model';
import { finishSession } from '../src/domain/learning';

const KEY = 'sci1-germination:v1';
async function seed(page: Page, session: Session, sound = false) {
  await page.goto('/');
  await page.evaluate(([key, s, soundOn]) => localStorage.setItem(key, JSON.stringify({ version: 1, session: s, soundEnabled: soundOn, settings: { hintsEnabled: true, scoreEnabled: true, allowedModes: 'both', maxMembers: 5, discussionCountdown: true }, classRecords: [], teacherPin: '1234' })), [KEY, session, sound] as const);
  await page.reload();
}
function prepared(day = 5) {
  let session = createSession('individual', 'Aina', '1 Bestari', []);
  const tube = (id: 'A' | 'B' | 'C' | 'D', materials: string[], extra: Record<string, unknown> = {}) => ({
    id, materials, location: 'bench' as const, waterAvailable: false, oxygenAvailable: true, temperatureC: 25, validated: true, attempts: 0, hintLevel: 0, placementConfirmed: true, ...extra,
  });
  session = { ...session, screen: 'simulation', day, maxDay: 5, experimentStartedAt: new Date().toISOString(), completedSteps: [0, 1, 2, 3],
    tubes: { A: tube('A', ['seed', 'wetCotton', 'water'], { waterAvailable: true }), B: tube('B', ['seed', 'dryCotton']), C: tube('C', ['seed', 'wetCotton', 'cooledBoiledWater', 'oil'], { waterAvailable: true, oxygenAvailable: false }), D: tube('D', ['seed', 'wetCotton', 'water'], { waterAvailable: true, temperatureC: 5 }) } as Session['tubes'] };
  return session;
}
function finished() {
  let session = createSession('individual', 'Aina', '1 Bestari', []);
  session = { ...session, hypothesis: 1, predictionMade: true, prediction: ['A'], completedSteps: [0, 1, 2, 3, 4, 5, 6, 7],
    conclusion: ['AIR', 'OKSIGEN', 'SUHU'], conclusionChecked: true, hintsUsed: 0,
    explanationAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' },
    analysisFirstAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' },
    resultsCheck: { correct: 16, total: 16 },
    scores: { hypothesis: 2, setup: 8, observation: 4, results: 8, analysis: 4, conclusion: 4, bonus: 0 } };
  return finishSession(session);
}

test('journey rail shows every step with its own state', async ({ page }) => {
  const session = { ...createSession('individual', 'Aina', '1 Bestari', []), screen: 'hypothesis' as const };
  await seed(page, session);
  const rail = page.getByRole('navigation', { name: 'Kemajuan eksperimen' });
  await expect(rail.locator('li')).toHaveCount(9);
  await expect(rail.locator('li[data-state="now"]')).toHaveCount(1);
  await expect(rail.locator('li[data-state="locked"]')).toHaveCount(8);
  await expect(rail.locator('li').first().getByText('🤔')).toBeVisible();
});

test('replay plays day one to five automatically and celebrates at the end', async ({ page }) => {
  await seed(page, prepared(5));
  await page.getByRole('button', { name: 'Tonton semula Hari 1–5' }).click();
  await expect(page.locator('.day-badge strong')).toHaveText('1');
  await expect(page.locator('.day-badge strong')).toHaveText('2', { timeout: 6000 });
  await expect(page.locator('.day-badge strong')).toHaveText('5', { timeout: 12000 });
  await expect(page.locator('#confetti-layer .confetti-piece').first()).toBeAttached({ timeout: 6000 });
});

test('final screen celebrates with confetti, badges and a printable certificate', async ({ page }) => {
  await seed(page, finished());
  await expect(page.getByText('EKSPERIMEN SELESAI')).toBeVisible();
  await expect(page.locator('#confetti-layer .confetti-piece').first()).toBeAttached({ timeout: 6000 });
  const shelf = page.locator('.badge-shelf');
  await expect(shelf).toBeVisible();
  await expect(shelf).toContainText('Penyiasat Muda');
  await expect(shelf).toContainText('Mata Helang');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Cetak sijil' }).click();
  const cert = await popupPromise;
  await cert.waitForLoadState('domcontentloaded');
  await expect(cert.getByText('SIJIL PENYIASAT MUDA')).toBeVisible();
  await expect(cert.getByText('Aina').first()).toBeVisible();
  await cert.close();
});

test('Cik Biji mascot greets pupils and guides each screen', async ({ page }) => {
  await seed(page, { ...createSession('individual', 'Aina', '1 Bestari', []), screen: 'hypothesis' as const });
  const mascot = page.locator('.seed-mascot');
  await expect(mascot).toBeVisible();
  await expect(mascot.locator('.seed-mascot-bubble')).toContainText('Fikir dahulu');
});

test('speech button narrates and stops without errors', async ({ page }) => {
  await seed(page, { ...createSession('individual', 'Aina', '1 Bestari', []), screen: 'hypothesis' as const });
  const baca = page.getByRole('button', { name: 'Baca arahan' });
  await expect(baca).toBeVisible();
  await baca.click();
  await expect(page.getByRole('button', { name: 'Berhenti baca arahan' })).toBeVisible();
  await page.getByRole('button', { name: 'Berhenti baca arahan' }).click();
  await expect(page.getByRole('button', { name: 'Baca arahan' })).toBeVisible();
});
