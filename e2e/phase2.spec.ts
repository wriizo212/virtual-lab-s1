import { test, expect, type Page, type Locator } from '@playwright/test';
async function register(page: Page, group = false) {
  await page.goto('/'); await page.getByRole('button', { name: group ? /Kumpulan 2/ : /Individu Teroka/ }).tap();
  await page.getByLabel(group ? 'Nama kumpulan' : 'Nama murid').fill(group ? 'Tunas' : 'Aina');
  await page.getByLabel('Kelas', { exact: true }).fill('1 Bestari');
  if (group) {
    for (const [i, name] of ['Ahmad', 'Siti', 'Mei'].entries()) await page.getByLabel(`Ahli ${i + 1}`, { exact: true }).fill(name);
    await page.getByRole('button', { name: 'Tetapkan peranan' }).tap();
  }
  await page.getByRole('button', { name: 'Teruskan', exact: true }).tap();
  await page.getByRole('button', { name: 'Mulakan penyiasatan' }).tap();
  await expect(page.getByRole('button', { name: 'Simpan & buat ramalan' })).toBeDisabled();
  await page.getByRole('radio').nth(0).check(); // Incorrect hypothesis deliberately retained without feedback.
  await page.getByRole('button', { name: 'Simpan & buat ramalan' }).tap();
  await page.getByRole('button', { name: /Tabung A Masukkan/ }).tap();
  await page.getByRole('button', { name: /Tabung C Masukkan/ }).tap();
  if (group) { await expect(page.getByRole('button', { name: 'Simpan & masuk makmal' })).toBeDisabled(); await page.getByRole('button', { name: 'Mula 30 saat' }).tap(); await page.getByRole('button', { name: 'Langkau pemasa' }).tap(); await page.getByRole('button', { name: 'Ya, semua setuju' }).tap(); }
  await page.getByRole('button', { name: 'Simpan & masuk makmal' }).tap();
}
async function add(page: Page, material: string, tube: string) {
  await page.getByRole('button', { name: `Pilih bahan ${material}`, exact: true }).tap();
  await page.getByRole('button', { name: `Pilih Tabung ${tube}`, exact: true }).tap();
}
async function touchDrag(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox(); const to = await target.boundingBox();
  if (!from || !to) throw new Error('Drag target missing');
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
  await expect(page.locator('.drag-overlay')).toBeVisible();
  for (let i = 1; i <= 15; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + (end.x - start.x) * i / 15, y: start.y + (end.y - start.y) * i / 15, id: 1 }] });
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
}
test('complete A–D by tap, hints, correction and persistence', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await register(page);
  await expect(page.getByRole('button', { name: 'Selesai penyediaan' })).toBeDisabled();
  await add(page, 'Biji benih', 'A'); await add(page, 'Kapas kering', 'A');
  await page.getByRole('button', { name: 'Semak Tabung A', exact: true }).tap();
  await expect(page.getByText('Hmm… terdapat sesuatu yang kurang tepat.')).toBeVisible();
  await page.getByRole('button', { name: /Dapatkan petunjuk/ }).tap();
  await page.getByRole('button', { name: /Dapatkan petunjuk/ }).tap();
  await expect(page.getByRole('button', { name: /Dapatkan petunjuk/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Semak Tabung A', exact: true }).tap();
  await page.getByRole('button', { name: /Dapatkan petunjuk/ }).tap();
  await expect(page.getByText('Petunjuk 3', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('Petunjuk 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Keluarkan Kapas kering dari Tabung A' }).tap();
  await add(page, 'Kapas lembap', 'A'); await add(page, 'Kertas hitam', 'A');
  await page.getByRole('button', { name: 'Letakkan Tabung A pada suhu bilik' }).tap();
  await page.getByRole('button', { name: 'Semak Tabung A', exact: true }).tap();
  await expect(page.getByTestId('tube-A')).toContainText('Lengkap');
  await add(page, 'Biji benih', 'B'); await add(page, 'Kapas kering', 'B');
  await page.getByRole('button', { name: 'Letakkan Tabung B pada suhu bilik' }).tap(); await page.getByRole('button', { name: 'Semak Tabung B', exact: true }).tap();
  await add(page, 'Biji benih', 'C'); await add(page, 'Air didih disejukkan', 'C'); await add(page, 'Minyak masak', 'C');
  await expect(page.getByTestId('tube-C').locator('.oil-layer')).toBeVisible();
  await page.getByRole('button', { name: 'Letakkan Tabung C pada suhu bilik' }).tap(); await page.getByRole('button', { name: 'Semak Tabung C', exact: true }).tap();
  await add(page, 'Biji benih', 'D'); await add(page, 'Kapas lembap', 'D');
  await page.getByRole('button', { name: 'Letakkan Tabung D dalam peti sejuk' }).tap(); await page.getByRole('button', { name: 'Semak Tabung D', exact: true }).tap();
  await expect(page.getByText('4 / 4 lengkap')).toBeVisible();
  await page.screenshot({ path: 'test-results/phase2-tablet-lab.png', fullPage: true });
  await page.getByRole('button', { name: 'Selesai penyediaan' }).tap(); await page.reload();
  await expect(page.getByRole('heading', { name: 'Makmal anda sudah bersedia.' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sci1-germination:v1')!).session);
  expect(saved.prediction).toEqual(['A','C']); expect(saved.hypothesis).toBe(0); expect(saved.hintsUsed).toBe(3); expect(saved.scores.setup).toBe(8);
  await page.getByRole('button', { name: 'Kembali ke makmal' }).tap(); await page.getByRole('button', { name: 'Keluarkan Kapas lembap dari Tabung D' }).tap();
  await expect(page.getByRole('button', { name: 'Selesai penyediaan' })).toBeDisabled(); expect(errors).toEqual([]);
});
test('real touch events drag materials and D to refrigerator, group turns rotate', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 }); await register(page, true);
  await expect(page.getByText('Giliran: Siti', { exact: true })).toBeVisible();
  await touchDrag(page, page.getByRole('button', { name: 'Seret Biji benih', exact: true }), page.getByTestId('tube-B'));
  await expect(page.getByRole('button', { name: 'Keluarkan Biji benih dari Tabung B' })).toBeVisible();
  await expect(page.getByText('Giliran: Mei', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pilih Tabung C', exact: true }).tap();
  await expect(page.getByText('Giliran: Ahmad', { exact: true })).toBeVisible();
  await add(page, 'Biji benih', 'D'); await add(page, 'Kapas lembap', 'D');
  await touchDrag(page, page.getByRole('button', { name: 'Seret Tabung D', exact: true }), page.getByRole('button', { name: 'Letakkan Tabung D dalam peti sejuk' }));
  await expect(page.getByTestId('tube-D')).toContainText('Peti sejuk');
  await page.getByRole('button', { name: 'Semak Tabung D', exact: true }).tap();
  await page.reload(); await expect(page.getByTestId('tube-D')).toContainText('Lengkap');
  await page.screenshot({ path: 'test-results/phase2-group-lab.png', fullPage: true });
});
test('mobile lab tap fallback, keyboard access and reset', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await register(page);
  await page.getByRole('button', { name: 'Pilih bahan Biji benih', exact: true }).focus(); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Pilih Tabung B', exact: true }).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Keluarkan Biji benih dari Tabung B' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/phase2-mobile-lab.png', fullPage: true });
  await page.getByRole('button', { name: 'Reset sesi', exact: true }).tap(); await page.getByRole('button', { name: 'Ya, reset sesi' }).tap(); await page.reload();
  await expect(page.getByRole('button', { name: /Individu Teroka/ })).toBeVisible();
});
test('mouse drag uses the same material state and can undo preparation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 }); await register(page);
  const source = page.getByRole('button', { name: 'Seret Biji benih', exact: true }); const target = page.getByTestId('tube-A');
  await source.scrollIntoViewIfNeeded(); const from = await source.boundingBox(); const to = await target.boundingBox();
  if (!from || !to) throw new Error('Drag target missing');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2); await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 }); await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Keluarkan Biji benih dari Tabung A' })).toBeVisible();
  await page.getByRole('button', { name: 'Kosongkan Tabung A' }).click(); await page.getByRole('button', { name: 'Batal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keluarkan Biji benih dari Tabung A' })).toBeVisible();
  await page.getByRole('button', { name: 'Kosongkan Tabung A' }).click(); await page.getByRole('button', { name: 'Ya, kosongkan' }).click();
  await expect(page.getByText('Tabung masih kosong.')).toBeVisible();
});

