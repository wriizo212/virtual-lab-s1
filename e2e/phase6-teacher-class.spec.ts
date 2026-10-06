import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createSession } from '../src/domain/model';
import { finishSession } from '../src/domain/learning';
import { encodeShareCode } from '../src/domain/classroom';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

function finished(name: string, className: string, mode: 'individual' | 'group' = 'individual') {
  let session = createSession(mode, name, className, mode === 'group' ? ['Aina', 'Siti', 'Mei'] : []);
  session = { ...session, hypothesis: 1, predictionMade: true, prediction: ['A'], completedSteps: [0, 1, 2, 3, 4, 5, 6, 7],
    conclusion: ['AIR', 'OKSIGEN', 'SUHU'], conclusionChecked: true,
    explanationAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' },
    scores: { hypothesis: 2, setup: 8, observation: 4, results: 8, analysis: 4, conclusion: 4, bonus: 0 } };
  return finishSession(session);
}
async function openClassSummary(page: Page) {
  await page.getByRole('button', { name: 'Guru', exact: true }).tap();
  await page.getByLabel('PIN guru', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Buka mod guru' }).tap();
  await page.getByRole('button', { name: 'Ringkasan kelas' }).tap();
}
test('teacher imports class codes, dedupes, exports CSV and keeps pupil session untouched', async ({ page }) => {
  const aina = finished('Aina', '1 Bestari');
  const tunas = finished('Kumpulan Tunas', '1 Cekal', 'group');
  const codeA = encodeShareCode(aina);
  const codeB = encodeShareCode(tunas);
  await page.goto('/');
  await openClassSummary(page);
  await expect(page.getByText('Belum ada rekod diimport pada peranti ini.')).toBeVisible();
  await page.getByLabel('Kod kelas murid').fill(`Hai cikgu, kod saya: ${codeA}\n${codeB}\nkod lama SCI1-GERM-ABCDEF1 abaikan`);
  await page.getByRole('button', { name: 'Import kod' }).tap();
  await expect(page.getByText(/Rekod ditambah: 2/)).toBeVisible();
  await expect(page.locator('.class-summary tbody tr')).toHaveCount(2);
  await expect(page.locator('.class-summary tbody')).toContainText('Aina');
  await expect(page.locator('.class-summary tbody')).toContainText('Kumpulan');
  await page.getByLabel('Kod kelas murid').fill(codeA);
  await page.getByRole('button', { name: 'Import kod' }).tap();
  await expect(page.getByText(/dikemas kini: 1/)).toBeVisible();
  await expect(page.locator('.class-summary tbody tr')).toHaveCount(2);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('sci1-germination:v1')!));
  expect(stored.session).toBeNull();
  expect(stored.classRecords).toHaveLength(2);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksport CSV' }).tap();
  const csvText = readFileSync((await (await downloadPromise).path())!, 'utf8');
  expect(csvText).toContain('Kelas,Nama,Mod');
  expect(csvText).toContain('Aina');
  expect(csvText).toContain('Kumpulan Tunas');
  await page.getByRole('button', { name: 'Salin ringkasan' }).tap();
  await expect(page.getByText(/Ringkasan teks disalin|Pilih teks di bawah/)).toBeVisible();
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Cetak / simpan PDF' }).tap();
  const popup = await popupPromise;
  await expect(popup.locator('table tbody tr')).toHaveCount(2);
  await expect(popup.getByText('Aina', { exact: false }).first()).toBeVisible();
  await popup.close();
  await page.getByRole('button', { name: 'Imbas kod QR' }).tap();
  const scanner = page.getByRole('dialog', { name: 'Imbas kod QR' });
  await expect(scanner).toBeVisible();
  await expect(scanner.getByRole('status')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(scanner).toHaveCount(0);
  await page.getByRole('button', { name: 'Tutup mod guru' }).tap();
  await page.reload();
  await openClassSummary(page);
  await expect(page.locator('.class-summary tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Buang rekod Aina' }).tap();
  await expect(page.locator('.class-summary tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Kosongkan senarai' }).tap();
  await page.getByRole('button', { name: 'Ya, padam rekod' }).tap();
  await expect(page.getByText('Belum ada rekod diimport pada peranti ini.')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sci1-germination:v1')!).classRecords)).toEqual([]);
});
test('student result screen offers a copyable class code', async ({ page }) => {
  const session = finished('Aina', '1 Bestari');
  await page.goto('/');
  await page.evaluate(s => localStorage.setItem('sci1-germination:v1', JSON.stringify({ version: 1, session: s, soundEnabled: false, settings: { hintsEnabled: true, scoreEnabled: true, allowedModes: 'both', maxMembers: 5, discussionCountdown: true }, classRecords: [] })), { ...session, screen: 'final' });
  await page.reload();
  const code = encodeShareCode(session);
  await expect(page.getByText(code, { exact: true }).first()).toBeVisible();
  await expect(page.locator('.class-qr').first()).toBeVisible();
  await page.getByRole('button', { name: 'Salin kod kelas' }).tap();
  await expect(page.getByRole('button', { name: 'Kod kelas disalin' }).or(page.getByRole('textbox', { name: 'Kod kelas untuk salinan manual' })).first()).toBeVisible();
  await page.getByRole('button', { name: 'Lihat laporan' }).tap();
  await expect(page.locator('.report-qr-row .class-qr')).toBeVisible();
});
test('teacher PIN can be changed on the device', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Guru', exact: true }).tap();
  await page.getByLabel('PIN guru', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Buka mod guru' }).tap();
  await page.getByRole('button', { name: 'Tukar PIN guru' }).tap();
  await page.getByLabel('PIN baharu', { exact: true }).fill('2468');
  await page.getByLabel('Ulang PIN baharu', { exact: true }).fill('2499');
  await page.getByRole('button', { name: 'Simpan PIN baharu' }).tap();
  await expect(page.getByText('PIN tidak sama. Taip semula dengan teliti.')).toBeVisible();
  await page.getByLabel('Ulang PIN baharu', { exact: true }).fill('2468');
  await page.getByRole('button', { name: 'Simpan PIN baharu' }).tap();
  await expect(page.getByText(/PIN guru telah dikemas kini/)).toBeVisible();
  await page.getByRole('button', { name: 'Tutup mod guru' }).tap();
  await page.reload();
  await page.getByRole('button', { name: 'Guru', exact: true }).tap();
  await page.getByLabel('PIN guru', { exact: true }).fill('1234');
  await page.getByRole('button', { name: 'Buka mod guru' }).tap();
  await expect(page.getByText('PIN tidak tepat. Cuba semula.')).toBeVisible();
  await page.getByLabel('PIN guru', { exact: true }).fill('2468');
  await page.getByRole('button', { name: 'Buka mod guru' }).tap();
  await expect(page.getByRole('button', { name: 'Tukar PIN guru' })).toBeVisible();
  const storedPin = await page.evaluate(() => JSON.parse(localStorage.getItem('sci1-germination:v1')!).teacherPin);
  expect(storedPin).toBe('2468');
});
