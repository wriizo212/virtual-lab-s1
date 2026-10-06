import { test,expect,type Page,type Locator } from '@playwright/test';
import { createSession } from '../src/domain/model';
import { editMaterial,placeTube,recipes,tubeIds,updateTube,validateTube } from '../src/domain/experiment';
import { advanceDay,checkResults,editResult,expectedResult,finishObservations,recordObservation,resultFields,startExperiment } from '../src/domain/simulation';
import { analysisQuestions,setPredictionComparison } from '../src/domain/learning';
async function resumeEvidence(page:Page,group=false,scoreEnabled=true) {
  let s=createSession(group?'group':'individual',group?'Tunas':'Aina','1 Bestari',group?['Ahmad','Siti','Mei']:[]);
  s={...s,hypothesis:1,predictionMade:true,prediction:['A','C'],completedSteps:[0,1]};
  for(const id of tubeIds){let tube=s.tubes[id];for(const material of recipes[id].required)tube=editMaterial(tube,material).tube;s=updateTube(s,validateTube(placeTube(tube,recipes[id].location)));}
  s=startExperiment(s);for(let i=0;i<4;i++)s=advanceDay(s);for(const id of tubeIds)s=recordObservation(s,id,id==='A');s=finishObservations(s);
  for(const id of tubeIds)for(const field of resultFields)s=editResult(s,id,field,expectedResult(s.tubes[id])[field]);
  s=setPredictionComparison(checkResults(s),false);s.screen='comparison';
  await page.goto('/');await page.evaluate(({session,scoreEnabled})=>localStorage.setItem('sci1-germination:v1',JSON.stringify({version:1,session,soundEnabled:false,settings:{hintsEnabled:true,scoreEnabled,allowedModes:'both',maxMembers:5,discussionCountdown:true}})),{session:s,scoreEnabled});
  await page.reload();await page.getByRole('button',{name:'Teruskan analisis'}).tap();
}
async function analysis(page:Page,group=false,wrongFirst=false) {
  for(const [index,question]of analysisQuestions.entries()) {
    await page.getByRole('radio').nth(wrongFirst&&index===0?0:Number(question.answer)).check();
    if(group)await page.getByRole('button',{name:'Ya, semua setuju',exact:true}).tap();
    await page.getByRole('button',{name:'Semak penjelasan'}).tap();
    if(wrongFirst&&index===0) {
      await expect(page.getByText('Mari semak sebabnya.',{exact:true})).toBeVisible();
      await page.getByRole('radio').nth(Number(question.answer)).check();
      await page.getByRole('button',{name:'Semak penjelasan'}).tap();
    }
    if(index===1) {
      await expect(page.getByRole('img',{name:/Lapisan minyak terapung/})).toBeVisible();
      await page.screenshot({path:'test-results/phase4-analysis.png',fullPage:true});
    }
    await page.getByRole('button',{name:index<3?'Soalan seterusnya':'Bina kesimpulan',exact:true}).tap();
  }
}
async function word(page:Page,token:string,slot:number) {
  await page.getByRole('button',{name:`Pilih perkataan ${token}`,exact:true}).tap();
  const target=page.getByTestId(`word-slot-${slot}`);
  const empty=target.getByRole('button',{name:`Isi ruang ${slot+1}`});
  if(await empty.count())await empty.tap();else await target.getByRole('button',{name:/Pilih perkataan/}).tap();
}
async function conclusion(page:Page,group=false) {
  await word(page,'AIR',0);await word(page,'OKSIGEN',1);await word(page,'SUHU',2);
  if(group)await page.getByRole('button',{name:'Ya, semua setuju',exact:true}).tap();
  await page.getByRole('button',{name:'Semak kesimpulan'}).tap();
  await expect(page.getByText('Kesimpulan anda disokong oleh bukti eksperimen.')).toBeVisible();
  await page.screenshot({path:'test-results/phase4-conclusion.png',fullPage:true});
  await page.getByRole('button',{name:'Buka cabaran'}).tap();
}
async function touchDrag(page:Page,source:Locator,target:Locator) {
  await source.scrollIntoViewIfNeeded();const from=await source.boundingBox();const to=await target.boundingBox();if(!from||!to)throw new Error('Missing word target');
  const start={x:from.x+from.width/2,y:from.y+from.height/2};const end={x:to.x+to.width/2,y:to.y+to.height/2};
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});await expect(page.locator('.drag-overlay')).toBeVisible();
  for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/15,y:start.y+(end.y-start.y)*i/15,id:1}]});await page.waitForTimeout(20);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
}
test('individual analysis correction, conclusion touch drag, challenge bonus and report persist',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await resumeEvidence(page);await analysis(page,false,true);
  await touchDrag(page,page.getByRole('button',{name:'Seret perkataan AIR',exact:true}),page.getByTestId('word-slot-0'));
  await expect(page.getByTestId('word-slot-0')).toContainText('AIR');
  await word(page,'SUHU',1);await word(page,'OKSIGEN',2);
  await page.getByRole('button',{name:'Semak kesimpulan'}).tap();await expect(page.getByText('Susunan ini belum tepat.')).toBeVisible();
  await word(page,'SUHU',2); // Swap SUHU with OKSIGEN; no duplication.
  await page.getByRole('button',{name:'Semak kesimpulan'}).tap();await page.reload();
  await expect(page.getByText('Kesimpulan anda disokong oleh bukti eksperimen.')).toBeVisible();
  await page.getByRole('button',{name:'Buka cabaran'}).tap();
  await page.getByRole('button',{name:'70°C',exact:true}).tap();await page.getByRole('button',{name:'Uji keadaan'}).tap();
  await expect(page.getByRole('heading',{name:'Tidak bercambah',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Suhu',exact:true}).check();await page.getByRole('button',{name:'Semak sebab'}).tap();
  await expect(page.getByText('Hubungan sebab dan akibat anda tepat.')).toBeVisible();
  await page.getByRole('button',{name:'25°C',exact:true}).tap();
  await expect(page.getByText(/Tetapan telah berubah/)).toBeVisible();
  await page.getByRole('button',{name:'Uji keadaan'}).tap();await expect(page.getByRole('heading',{name:'Bercambah',exact:true})).toBeVisible();
  await page.getByRole('checkbox',{name:'Ketiga-tiga syarat dipenuhi',exact:true}).check();await page.getByRole('button',{name:'Semak sebab'}).tap();
  await page.screenshot({path:'test-results/phase4-challenge.png',fullPage:true});
  await page.getByRole('button',{name:'Selesai & lihat hasil'}).tap();
  await expect(page.locator('.total-score strong')).toHaveText('29');await expect(page.getByText('Bonus cabaran: +2 (di luar 30)')).toBeVisible();
  await page.screenshot({path:'test-results/phase4-final.png',fullPage:true});
  await page.getByRole('button',{name:'Lihat laporan'}).tap();await page.reload();
  await expect(page.getByRole('heading',{name:'Syarat percambahan biji benih',exact:true})).toBeVisible();
  await expect(page.getByText('Cadangan TP untuk pertimbangan guru',{exact:true})).toBeVisible();
  await expect(page.locator('.pbd-level')).toHaveText('TP5');
  await expect(page.locator('.report-analysis li').first()).toContainText('Jawapan pertama: Tiada cahaya.');
  await expect(page.locator('.report-analysis li').first()).toContainText('Jawapan terakhir murid: Tiada air.');
  await expect(page.locator('.challenge-log article')).toHaveCount(2);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sci1-germination:v1')!).session.scores.bonus)).toBe(2);
  await page.screenshot({path:'test-results/phase4-report.png',fullPage:true});expect(errors).toEqual([]);
});
test('group decisions, optional challenge and contribution reflection do not penalize score',async({page})=>{
  await resumeEvidence(page,true);await analysis(page,true);await conclusion(page,true);
  await page.getByRole('button',{name:'Langkau cabaran & lihat hasil'}).tap();
  await expect(page.getByRole('heading',{name:'Setiap ahli, satu refleksi.'})).toBeVisible();
  const members=page.locator('.reflection-members fieldset');await expect(members).toHaveCount(3);
  await members.nth(0).getByRole('checkbox',{name:'Membina eksperimen'}).check();
  await members.nth(1).getByRole('checkbox',{name:'Membuat pemerhatian'}).check();await page.reload();
  await expect(members.nth(0).getByRole('checkbox',{name:'Membina eksperimen'})).toBeChecked();
  await page.getByRole('button',{name:'Selesai refleksi'}).tap();await expect(page.locator('.total-score strong')).toHaveText('30');
  await page.getByRole('button',{name:'Lihat laporan'}).tap();await expect(page.locator('.pbd-level')).toHaveText('TP4');
  await expect(page.getByText('Cabaran pilihan dilangkau. Markah utama tidak terjejas.')).toBeVisible();
  await expect(page.getByText('Mei: Belum ditandakan')).toBeVisible();
});
test('phone and score-off report remain usable with refresh',async({page})=>{
  await page.setViewportSize({width:390,height:844});await resumeEvidence(page,false,false);await analysis(page);await conclusion(page);
  await page.getByRole('button',{name:'Langkau cabaran & lihat hasil'}).tap();await expect(page.locator('.score-breakdown')).toHaveCount(0);
  await page.getByRole('button',{name:'Lihat laporan'}).tap();await page.reload();await expect(page.locator('.score-breakdown')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/phase4-phone-report.png',fullPage:true});
});
