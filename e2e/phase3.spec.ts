import { test, expect, type Page } from '@playwright/test';
import { createSession } from '../src/domain/model';
import { editMaterial, placeTube, recipes, tubeIds, updateTube, validateTube } from '../src/domain/experiment';

async function resumePrepared(page: Page, group = false) {
  let session = createSession(group ? 'group' : 'individual', group ? 'Tunas' : 'Aina', '1 Bestari', group ? ['Ahmad','Siti','Mei'] : []);
  session = { ...session, hypothesis: 1, predictionMade: true, prediction: ['A','C'], completedSteps: [0,1] };
  for (const id of tubeIds) {
    let tube = session.tubes[id]; for (const material of recipes[id].required) tube = editMaterial(tube,material).tube;
    session = updateTube(session,validateTube(placeTube(tube,recipes[id].location)));
  }
  session.screen = 'setupComplete';
  await page.goto('/');
  await page.evaluate(s => localStorage.setItem('sci1-germination:v1', JSON.stringify({ version:1, session:s, soundEnabled:false, settings:{hintsEnabled:true,scoreEnabled:true,allowedModes:'both',maxMembers:5,discussionCountdown:true} })), session);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Makmal anda sudah bersedia.' })).toBeVisible();
  await page.getByRole('button', { name:'Mulakan eksperimen', exact:true }).tap();
}
async function inspect(page: Page, id: string, value: boolean) {
  await page.getByRole('button',{name:`Zoom Tabung ${id}`,exact:true}).tap();
  const modal = page.getByRole('dialog', { name:`Pemerhatian Tabung ${id}` });
  if (id === 'A') {
    await expect(modal.getByRole('button',{name:'Bercambah',exact:true})).toBeDisabled();
    await modal.getByRole('button',{name:'Buka balutan maya'}).tap();
  }
  await modal.getByRole('button',{name:value?'Bercambah':'Tidak bercambah',exact:true}).tap();
  await modal.getByRole('button',{name:'Simpan pemerhatian'}).tap();
}
test('manual timeline, zoom observations, 16-cell feedback and prediction comparison persist', async ({ page }) => {
  const errors: string[]=[]; page.on('pageerror',error=>errors.push(error.message));
  await resumePrepared(page);
  await expect(page.getByRole('button',{name:'Hari 5',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:/5. Pemerhatian/})).toBeDisabled();
  await page.getByRole('button',{name:'Hari seterusnya'}).tap();
  await page.reload(); await expect(page.locator('.day-badge strong')).toHaveText('2');
  await page.getByRole('button',{name:'Lihat di sebalik balutan'}).tap();
  await expect(page.getByTestId('simulation-A').locator('[data-stage]')).toHaveAttribute('data-stage','1');
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Hari seterusnya'}).tap();
  await expect(page.getByRole('button',{name:'Hari seterusnya'})).toBeDisabled();
  await expect(page.getByTestId('simulation-A').locator('[data-stage]')).toHaveAttribute('data-stage','4');
  for(const id of ['B','C','D']) await expect(page.getByTestId(`simulation-${id}`).locator('[data-stage]')).toHaveAttribute('data-stage','0');
  await page.screenshot({ path:'test-results/phase3-tablet-simulation.png',fullPage:true });
  await page.getByRole('button',{name:'Buat pemerhatian'}).tap();
  await expect(page.getByRole('button',{name:'Rekod jadual keputusan'})).toBeDisabled();
  await page.getByRole('button',{name:'Zoom Tabung A'}).tap();
  await page.getByRole('button',{name:'Buka balutan maya'}).tap();
  await page.screenshot({path:'test-results/phase3-zoom.png',fullPage:true});
  await page.keyboard.press('Escape');
  for(const id of tubeIds) await inspect(page,id,id==='A'||id==='C');
  await page.reload(); await expect(page.getByText('4 / 4 pemerhatian direkodkan')).toBeVisible();
  await page.getByRole('button',{name:'Rekod jadual keputusan'}).tap();
  await expect(page.getByRole('button',{name:'Semak jawapan'})).toBeDisabled();
  for(const id of tubeIds) {
    await page.getByLabel(`Air Tabung ${id}`,{exact:true}).selectOption(id==='B'?'false':'true');
    await page.getByLabel(`Udara (oksigen) Tabung ${id}`,{exact:true}).selectOption('true'); // C deliberately wrong.
    await page.getByLabel(`Suhu sesuai Tabung ${id}`,{exact:true}).selectOption(id==='D'?'false':'true');
    await page.getByLabel(`Percambahan Tabung ${id}`,{exact:true}).selectOption(id==='A'?'true':'false');
  }
  await page.getByRole('button',{name:'Semak jawapan'}).tap();
  await expect(page.getByText('15 daripada 16 jawapan betul.')).toBeVisible();
  await expect(page.locator('.review-cell')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Bandingkan ramalan'})).toBeDisabled();
  await page.reload(); await expect(page.getByText('15 daripada 16 jawapan betul.')).toBeVisible();
  await page.getByLabel('Udara (oksigen) Tabung C',{exact:true}).selectOption('false');
  await page.getByRole('button',{name:'Semak jawapan'}).tap();
  await expect(page.getByText('16 daripada 16 jawapan betul.')).toBeVisible();
  await page.screenshot({path:'test-results/phase3-tablet-results.png',fullPage:true});
  await page.getByRole('button',{name:'Bandingkan ramalan'}).tap();
  await expect(page.getByRole('heading',{name:'Tabung A dan Tabung C'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Tabung A sahaja'})).toBeVisible();
  await page.getByRole('button',{name:'Ya',exact:true}).tap();
  await expect(page.getByText('Bandingkan semula nama tabung dalam kedua-dua rekod.')).toBeVisible();
  await page.getByRole('button',{name:'Tidak',exact:true}).tap(); await page.reload();
  await expect(page.getByText('Pemerhatian dan keputusan selesai.')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sci1-germination:v1')!).session);
  expect(saved.scores.observation).toBe(3); expect(saved.scores.results).toBe(8); expect(saved.predictionComparison).toBe(false);
  await page.getByRole('button',{name:'3. Penyediaan',exact:true}).tap();
  await page.getByRole('button',{name:'Pilih Tabung D',exact:true}).tap();
  await page.getByRole('button',{name:'Keluarkan Kapas lembap dari Tabung D'}).tap();
  await expect(page.getByRole('button',{name:/5. Pemerhatian/})).toBeDisabled();
  const reset=await page.evaluate(()=>JSON.parse(localStorage.getItem('sci1-germination:v1')!).session);
  expect(reset.experimentStartedAt).toBeUndefined(); expect(reset.observations).toEqual({}); expect(reset.results).toEqual({});
  expect(errors).toEqual([]);
});
test('group autoplay can pause, resumes after refresh, ends on Day 5 and rotates observers', async ({ page }) => {
  await resumePrepared(page,true);
  await expect(page.getByText('Giliran: Ahmad · Ketua Eksperimen',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Auto play',exact:true}).tap();
  await expect(page.locator('.day-badge strong')).toHaveText('2',{timeout:6000});
  await page.getByRole('button',{name:'Jeda',exact:true}).tap();
  await page.reload(); await expect(page.locator('.day-badge strong')).toHaveText('2');
  await expect(page.getByRole('button',{name:'Auto play',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Auto play',exact:true}).tap();
  await expect(page.locator('.day-badge strong')).toHaveText('5',{timeout:12000});
  await expect(page.getByRole('button',{name:'Auto play',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Hari 2',exact:true}).tap();
  await expect(page.locator('.day-badge strong')).toHaveText('2');
  await page.getByRole('button',{name:'Buat pemerhatian'}).tap();
  await expect(page.getByText('Giliran: Mei · Pemerhati',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Zoom Tabung A'}).tap();
  await expect(page.getByRole('dialog').locator('.modal-turn')).toContainText('Mei');
  await page.getByRole('button',{name:'Tutup pemerhatian'}).tap();
  await page.getByRole('button',{name:'Zoom Tabung B'}).tap();
  await expect(page.getByRole('dialog').locator('.modal-turn')).toContainText('Ahmad');
  await page.getByRole('button',{name:'Tidak bercambah',exact:true}).tap();
  await page.getByRole('button',{name:'Simpan pemerhatian'}).tap();
  await page.reload(); await expect(page.getByTestId('observe-B')).toContainText('Direkod: Tidak bercambah');
});
test('phone fallback and reduced motion keep simulation, zoom and table usable', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'reduce'});
  await resumePrepared(page); for(let i=0;i<4;i++) await page.getByRole('button',{name:'Hari seterusnya'}).tap();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Buat pemerhatian'}).tap();
  for(const id of tubeIds) await inspect(page,id,id==='A');
  await page.getByRole('button',{name:'Rekod jadual keputusan'}).tap();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByLabel('Percambahan Tabung D',{exact:true}).selectOption('false');
  await expect(page.getByLabel('Percambahan Tabung D',{exact:true})).toHaveValue('false');
  await page.screenshot({path:'test-results/phase3-phone-results.png',fullPage:true});
});
