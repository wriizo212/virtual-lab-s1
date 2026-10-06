import {test,expect,type Page} from '@playwright/test';
import {analysisQuestions} from '../src/domain/learning';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
async function teacher(page:Page) {
  await page.getByRole('button',{name:'Guru',exact:true}).tap();
  await page.getByLabel('PIN guru',{exact:true}).fill('1234');
  await page.getByRole('button',{name:'Buka mod guru'}).tap();
}
test('teacher PIN, saved restrictions, independent example, and reset',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Guru',exact:true}).tap();
  await page.getByLabel('PIN guru',{exact:true}).fill('1111');await page.getByRole('button',{name:'Buka mod guru'}).tap();await expect(page.getByText('PIN tidak tepat. Cuba semula.')).toBeVisible();
  await page.getByLabel('PIN guru',{exact:true}).fill('1234');await page.getByRole('button',{name:'Buka mod guru'}).tap();
  await page.getByLabel('Mod yang dibenarkan').selectOption('group');await page.getByLabel('Maksimum ahli kumpulan').selectOption('2');
  await page.getByLabel('Aktifkan petunjuk').uncheck();await page.getByLabel('Paparkan markah').uncheck();await page.getByLabel('Pemasa perbincangan').uncheck();
  await page.getByRole('button',{name:'Lihat jawapan sebenar'}).tap();await expect(page.getByText('B: tiada air → tidak bercambah.')).toBeVisible();
  await page.getByRole('button',{name:'Lihat contoh laporan'}).tap();await expect(page.getByText('Contoh murid',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sci1-germination:v1')!).session)).toBeNull();
  await page.screenshot({path:'test-results/phase5-teacher.png',fullPage:true});
  await page.getByRole('button',{name:'Tutup mod guru'}).tap();await page.reload();
  await expect(page.getByRole('button',{name:/Individu Teroka/})).toHaveCount(0);await page.getByRole('button',{name:/Kumpulan 2/}).tap();
  await expect(page.getByLabel('Bilangan ahli')).toHaveValue('2');await expect(page.getByLabel('Bilangan ahli').locator('option')).toHaveCount(1);
  await page.getByLabel('Nama kumpulan').fill('Tunas');await page.getByLabel('Kelas',{exact:true}).fill('1 Bestari');await page.getByLabel('Ahli 1',{exact:true}).fill('Ahmad');await page.getByLabel('Ahli 2',{exact:true}).fill('Siti');
  await page.getByRole('button',{name:'Tetapkan peranan'}).tap();await page.getByRole('button',{name:'Teruskan',exact:true}).tap();await page.getByRole('button',{name:'Mulakan penyiasatan'}).tap();await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'Simpan & buat ramalan'}).tap();
  await expect(page.getByRole('button',{name:'Mula 30 saat'})).toHaveCount(0);await page.getByRole('button',{name:/Tabung A Masukkan/}).tap();await page.getByRole('button',{name:'Ya, semua setuju',exact:true}).tap();await page.getByRole('button',{name:'Simpan & masuk makmal'}).tap();
  await expect(page.getByRole('button',{name:/Dapatkan petunjuk/})).toHaveCount(0);
  await teacher(page);await page.getByRole('button',{name:'Lihat contoh laporan'}).tap();await expect(page.getByText('Contoh murid',{exact:true})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sci1-germination:v1')!).session.name)).toBe('Tunas');
  await page.getByRole('button',{name:'Reset eksperimen',exact:true}).tap();await page.getByRole('button',{name:'Batal reset'}).tap();await page.getByRole('button',{name:'Reset eksperimen',exact:true}).tap();await page.getByRole('button',{name:'Ya, padam sesi'}).tap();await page.reload();
  await expect(page.getByRole('button',{name:/Kumpulan 2/})).toBeVisible();await page.getByRole('button',{name:'Guru',exact:true}).tap();await expect(page.getByLabel('PIN guru')).toBeVisible();
});
test('production cache runs an entire experiment offline and exports a standalone report',async({page,context})=>{
  test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByText('✓ Aplikasi tersedia offline',{exact:true})).toBeVisible();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const cdp=await context.newCDPSession(page);expect((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);await cdp.detach();
  const manifest=await page.evaluate(async()=>{const link=document.querySelector<HTMLLinkElement>('link[rel=manifest]')!;return(await fetch(link.href)).json();});expect(manifest.display).toBe('standalone');expect(manifest.icons.map((i:{sizes:string})=>i.sizes)).toEqual(['192x192','512x512']);
  await context.setOffline(true);await page.reload();await expect(page.getByText(/Anda sedang offline/)).toBeVisible();
  await page.getByRole('button',{name:/Individu Teroka/}).tap();await page.getByLabel('Nama murid').fill('Aina <Sains>');await page.getByLabel('Kelas',{exact:true}).fill('1 Bestari');await page.getByRole('button',{name:'Teruskan',exact:true}).tap();
  await page.getByRole('button',{name:'Mulakan penyiasatan'}).tap();await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'Simpan & buat ramalan'}).tap();await page.getByRole('button',{name:/Tabung A Masukkan/}).tap();await page.getByRole('button',{name:'Simpan & masuk makmal'}).tap();
  const materials={A:['Biji benih','Kapas lembap','Kertas hitam'],B:['Biji benih','Kapas kering'],C:['Biji benih','Air didih disejukkan','Minyak masak'],D:['Biji benih','Kapas lembap']};
  for(const [id,list]of Object.entries(materials)){for(const material of list){await page.getByRole('button',{name:`Pilih bahan ${material}`,exact:true}).tap();await page.getByRole('button',{name:`Pilih Tabung ${id}`,exact:true}).tap();}await page.getByRole('button',{name:id==='D'?'Letakkan Tabung D dalam peti sejuk':`Letakkan Tabung ${id} pada suhu bilik`}).tap();await page.getByRole('button',{name:`Semak Tabung ${id}`,exact:true}).tap();}
  await page.reload();await expect(page.getByText('4 / 4 lengkap')).toBeVisible();await page.getByRole('button',{name:'Selesai penyediaan'}).tap();await page.getByRole('button',{name:'Mulakan eksperimen',exact:true}).tap();
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'Hari seterusnya'}).tap();await page.getByRole('button',{name:'Buat pemerhatian'}).tap();
  for(const id of ['A','B','C','D']){await page.getByRole('button',{name:`Zoom Tabung ${id}`,exact:true}).tap();if(id==='A')await page.getByRole('button',{name:'Buka balutan maya'}).tap();await page.getByRole('button',{name:id==='A'?'Bercambah':'Tidak bercambah',exact:true}).tap();await page.getByRole('button',{name:'Simpan pemerhatian'}).tap();}
  await page.getByRole('button',{name:'Rekod jadual keputusan'}).tap();for(const id of ['A','B','C','D']){await page.getByLabel(`Air Tabung ${id}`,{exact:true}).selectOption(id==='B'?'false':'true');await page.getByLabel(`Udara (oksigen) Tabung ${id}`,{exact:true}).selectOption(id==='C'?'false':'true');await page.getByLabel(`Suhu sesuai Tabung ${id}`,{exact:true}).selectOption(id==='D'?'false':'true');await page.getByLabel(`Percambahan Tabung ${id}`,{exact:true}).selectOption(id==='A'?'true':'false');}
  await page.getByRole('button',{name:'Semak jawapan'}).tap();await page.getByRole('button',{name:'Bandingkan ramalan'}).tap();await page.getByRole('button',{name:'Ya',exact:true}).tap();await page.getByRole('button',{name:'Teruskan analisis'}).tap();
  for(const [i,q]of analysisQuestions.entries()){await page.getByRole('radio').nth(Number(q.answer)).check();await page.getByRole('button',{name:'Semak penjelasan'}).tap();await page.getByRole('button',{name:i<3?'Soalan seterusnya':'Bina kesimpulan',exact:true}).tap();}
  for(const [i,word]of ['AIR','OKSIGEN','SUHU'].entries()){await page.getByRole('button',{name:`Pilih perkataan ${word}`,exact:true}).tap();await page.getByRole('button',{name:`Isi ruang ${i+1}`}).tap();}
  await page.getByRole('button',{name:'Semak kesimpulan'}).tap();await page.getByRole('button',{name:'Buka cabaran'}).tap();await page.getByRole('button',{name:'Langkau cabaran & lihat hasil'}).tap();await page.getByRole('button',{name:'Lihat laporan'}).tap();await page.reload();
  await expect(page.locator('.total-score strong')).toHaveText('30');await expect(page.getByText('Aina <Sains>',{exact:true})).toBeVisible();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Muat turun laporan'}).tap();const download=await downloadPromise;await download.saveAs('test-results/phase5-report.html');
  const standalone=await context.newPage();await standalone.goto(pathToFileURL(resolve('test-results/phase5-report.html')).href);await expect(standalone.getByText('Aina <Sains>',{exact:true})).toBeVisible();expect(await standalone.locator('script').count()).toBe(0);await standalone.emulateMedia({media:'print'});await standalone.pdf({path:'test-results/phase5-report.pdf',format:'A4',preferCSSPageSize:true});await standalone.screenshot({path:'test-results/phase5-print.png',fullPage:true});await standalone.close();
  await page.getByRole('button',{name:'Salin kod keputusan'}).tap();await expect(page.getByText(/Kod keputusan telah disalin|Pilih kod di bawah/)).toBeVisible();
  const popupPromise=page.waitForEvent('popup');await page.getByRole('button',{name:'Cetak / simpan PDF'}).tap();const popup=await popupPromise;await expect(popup.getByText('Aina <Sains>',{exact:true})).toBeVisible();await popup.close();expect(errors).toEqual([]);
});
test('phone teacher controls and install guidance fit without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Pasang aplikasi',exact:true}).tap();await expect(page.getByText(/iPad \/ Safari/)).toBeVisible();await teacher(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/phase5-phone.png',fullPage:true});
});
test('guide page loads with its QR and stays available offline',async({page,context})=>{
  await page.goto('/');await page.evaluate(()=>navigator.serviceWorker.ready);
  await context.setOffline(true);await page.goto('/panduan-kelas.html');
  await expect(page.getByRole('heading',{name:/Makmal maya/})).toBeVisible();
  await expect(page.locator('.qr-box svg')).toBeVisible();
  await expect(page.getByText('https://wriizo212.github.io/virtual-lab-s1/',{exact:true})).toBeVisible();
  await context.setOffline(false);
});
