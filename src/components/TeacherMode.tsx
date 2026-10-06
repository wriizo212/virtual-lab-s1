import { lazy, Suspense, useState } from 'react';
import { Camera, ClipboardList, Copy, Download, Printer, Share2, Trash2 } from 'lucide-react';
import { FocusModal } from './FocusModal';
import { useLab } from '../state/LabContext';
import { analysisQuestions, formatLabDate, hypothesisOptions } from '../domain/learning';
import { classSummaryHtml, classSummaryText, decodeShareCode, extractShareCodes, mergeRecords, recordsCsv } from '../domain/classroom';
import type { ClassRecord } from '../domain/model';
import { FinalReport } from '../pages/FinalReport';
import { exampleReport } from '../domain/demo';
// jsQR ships with the scanner chunk only — pupils never download it.
const CodeScanner = lazy(() => import('./CodeScanner').then(module => ({ default: module.CodeScanner })));
export function TeacherMode({onClose,onReset}:{onClose:()=>void;onReset:()=>void}) {
  const {state,updateSettings,updateRecords}=useLab();
  const [unlocked,setUnlocked]=useState(false),[pin,setPin]=useState(''),[error,setError]=useState('');
  const [answers,setAnswers]=useState(false),[sample,setSample]=useState(false),[confirm,setConfirm]=useState(false);
  const [classOpen,setClassOpen]=useState(false),[codeText,setCodeText]=useState(''),[importMsg,setImportMsg]=useState(''),[clearRecords,setClearRecords]=useState(false);
  const [scanOpen,setScanOpen]=useState(false),[textManual,setTextManual]=useState<string|null>(null);
  const [demo]=useState(exampleReport);
  const settings=state.settings;const records=state.classRecords ?? [];
  const scores=records.map(record=>record.score);const average=scores.length?Math.round(scores.reduce((sum,value)=>sum+value,0)/scores.length*10)/10:0;const highest=scores.length?Math.max(...scores):0;const lowest=scores.length?Math.min(...scores):0;
  function importClassCodes() {
    const tokens=extractShareCodes(codeText);const decoded=tokens.map(decodeShareCode).filter((record):record is ClassRecord=>record!==null);
    if(!decoded.length){setImportMsg(tokens.length?'Kod dijumpai tetapi tidak sah. Semak semula salinan kod.':'Tiada kod SCI1-KELAS dalam teks ini.');return;}
    const merged=mergeRecords(records,decoded);updateRecords(merged.records);
    const invalid=tokens.length-decoded.length;
    setImportMsg(`Rekod ditambah: ${merged.added} · dikemas kini: ${merged.updated}${invalid?` · kod tidak sah: ${invalid}`:''}.`);
    setCodeText('');
  }
  function exportClassCsv() {
    const url=URL.createObjectURL(new Blob([recordsCsv(records)],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='ringkasan-kelas.csv';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setImportMsg('Fail CSV dimuat turun. Buka dengan Excel atau Google Sheets.');
  }
  function handleScannedCode(code:string) {
    const record=decodeShareCode(code);
    if(!record){setImportMsg('Kod QR dibaca tetapi tidak sah.');return;}
    const merged=mergeRecords(records,[record]);updateRecords(merged.records);
    setImportMsg(`Kod dibaca: ${record.name} — ${merged.added?'ditambah ke senarai':merged.updated?'dikemas kini':'sudah ada dalam senarai'}.`);
  }
  function printClassSummary() {
    const popup=window.open('','_blank');
    if(!popup){setImportMsg('Tetingkap cetak disekat. Benarkan popup dan cuba lagi.');return;}
    popup.opener=null;popup.document.write(classSummaryHtml(records));popup.document.close();popup.focus();popup.print();
    setImportMsg('Pilih “Simpan sebagai PDF” dalam dialog cetak jika tersedia.');
  }
  async function copyClassText() {
    const text=classSummaryText(records);
    try{await navigator.clipboard.writeText(text);setTextManual(null);setImportMsg('Ringkasan teks disalin — boleh tampal ke Telegram atau WhatsApp.');}
    catch{setTextManual(text);setImportMsg('Pilih teks di bawah dan salin secara manual.');}
  }
  return <FocusModal title="Mod guru" closeLabel="Tutup mod guru" onClose={onClose}>
    <div className="teacher-panel"><div className="eyebrow">RUANG GURU</div><h1>Mod guru</h1>
    {!unlocked?<form onSubmit={e=>{e.preventDefault();if(pin==='1234'){setUnlocked(true);setError('');setPin('');}else setError('PIN tidak tepat. Cuba semula.');}}><p>Masukkan PIN guru untuk mengurus aktiviti.</p><label>PIN guru<input type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={pin} onChange={e=>setPin(e.target.value)}/></label>{error&&<p role="alert" className="error">{error}</p>}<button className="primary" type="submit">Buka mod guru</button></form>:<>
    <p className="muted">Tetapan disimpan pada peranti ini. Had ahli dan pilihan mod digunakan untuk sesi baharu.</p>
    <div className="teacher-settings">{([{key:'hintsEnabled',label:'Aktifkan petunjuk'},{key:'scoreEnabled',label:'Paparkan markah'},{key:'discussionCountdown',label:'Pemasa perbincangan'}] as const).map(item=><label key={item.key}><input type="checkbox" checked={settings[item.key]} onChange={e=>updateSettings({...settings,[item.key]:e.target.checked})}/>{item.label}</label>)}
    <label>Mod yang dibenarkan<select value={settings.allowedModes} onChange={e=>updateSettings({...settings,allowedModes:e.target.value as typeof settings.allowedModes})}><option value="both">Individu dan kumpulan</option><option value="individual">Individu sahaja</option><option value="group">Kumpulan sahaja</option></select></label>
    <label>Maksimum ahli kumpulan<select value={settings.maxMembers} onChange={e=>updateSettings({...settings,maxMembers:Number(e.target.value)})}>{[2,3,4,5].map(n=><option key={n} value={n}>{n} orang</option>)}</select></label></div>
    <div className="teacher-actions"><button className="secondary" onClick={()=>setClassOpen(!classOpen)} aria-expanded={classOpen}>{classOpen?'Tutup ringkasan kelas':'Ringkasan kelas'}</button><button className="secondary" onClick={()=>setAnswers(!answers)} aria-expanded={answers}>{answers?'Sembunyikan jawapan':'Lihat jawapan sebenar'}</button><button className="secondary" onClick={()=>setSample(!sample)} aria-expanded={sample}>{sample?'Tutup contoh laporan':'Lihat contoh laporan'}</button><button className="secondary" disabled={!state.session} onClick={()=>setConfirm(true)}>Reset eksperimen</button></div>
    {confirm&&<div className="teacher-confirm" role="alert"><p>Padam nama dan semua kemajuan sesi {state.session?.name}? Tetapan guru dikekalkan.</p><button className="secondary" onClick={()=>setConfirm(false)}>Batal reset</button><button className="primary" onClick={onReset}>Ya, padam sesi</button></div>}
    {classOpen&&<div className="class-summary"><h2>Ringkasan kelas</h2><p className="muted">Murid menyalin <strong>kod kelas</strong> pada skrin hasil atau laporan, kemudian menghantarnya kepada anda. Tampal satu atau lebih kod di bawah — teks lain diabaikan.</p>
    <label>Kod kelas murid<textarea rows={4} value={codeText} onChange={e=>setCodeText(e.target.value)} placeholder="Contoh: SCI1-KELAS-…"/></label>
    <div className="teacher-actions"><button className="primary" onClick={importClassCodes} disabled={!codeText.trim()}>Import kod</button><button className="secondary" onClick={()=>setScanOpen(true)}><Camera size={16}/>Imbas kod QR</button>{records.length>0&&<button className="secondary" onClick={printClassSummary}><Printer size={16}/>Cetak / simpan PDF</button>}{records.length>0&&<button className="secondary" onClick={copyClassText}><Copy size={16}/>Salin ringkasan</button>}{records.length>0&&'share' in navigator&&<button className="secondary" onClick={()=>{navigator.share({title:'Ringkasan Kelas — Virtual Lab',text:classSummaryText(records)}).catch(()=>{});}}><Share2 size={16}/>Kongsi</button>}{records.length>0&&<button className="secondary" onClick={exportClassCsv}><Download size={16}/>Eksport CSV</button>}{records.length>0&&<button className="secondary" onClick={()=>setClearRecords(true)}><Trash2 size={16}/>Kosongkan senarai</button>}</div>
    {importMsg&&<p role="status">{importMsg}</p>}
    {textManual!==null&&<textarea readOnly rows={5} value={textManual} aria-label="Ringkasan kelas untuk salinan manual" onFocus={e=>e.target.select()}/>}
    {clearRecords&&<div className="teacher-confirm" role="alert"><p>Padam semua rekod ringkasan kelas pada peranti ini? Sesi murid aktif tidak terjejas.</p><button className="secondary" onClick={()=>setClearRecords(false)}>Batal</button><button className="primary" onClick={()=>{updateRecords([]);setClearRecords(false);setImportMsg('Semua rekod ringkasan kelas telah dipadam.');}}>Ya, padam rekod</button></div>}
    {records.length>0?<><div className="class-stats"><span><ClipboardList size={15}/><strong>{records.length}</strong> rekod</span><span>Purata: <strong>{average}</strong> / 30</span><span>Tertinggi: <strong>{highest}</strong></span><span>Terendah: <strong>{lowest}</strong></span></div><div className="report-table-wrapper"><table className="report-table"><caption>Rekod yang diimport daripada kod murid</caption><thead><tr><th scope="col">Kelas</th><th scope="col">Nama</th><th scope="col">Mod</th><th scope="col">Markah</th><th scope="col">Bonus</th><th scope="col">TP</th><th scope="col">Ahli</th><th scope="col">Tarikh selesai</th><th scope="col">Buang</th></tr></thead><tbody>{records.map(record=><tr key={record.code}><td>{record.className}</td><td>{record.name}</td><td>{record.mode==='group'?'Kumpulan':'Individu'}</td><td>{record.score} / 30</td><td>{record.bonus>0?`+${record.bonus}`:'—'}</td><td>{record.tp}</td><td>{record.members||'—'}</td><td>{formatLabDate(record.completedAt)}</td><td><button className="text-button" aria-label={`Buang rekod ${record.name}`} onClick={()=>updateRecords(records.filter(item=>item.code!==record.code))}>Buang</button></td></tr>)}</tbody></table></div></>:<p className="small muted">Belum ada rekod diimport pada peranti ini.</p>}
    <p className="small muted">Rekod disimpan pada peranti ini sahaja dan kekal walaupun sesi murid direset. Panduan murid: <a href={`${import.meta.env.BASE_URL}panduan-kelas.html`} target="_blank" rel="noreferrer">buka / cetak halaman panduan</a>.</p></div>}
    {scanOpen&&<Suspense fallback={null}><CodeScanner onClose={()=>setScanOpen(false)} onCode={handleScannedCode}/></Suspense>}
    {answers&&<div className="teacher-answer-key"><h2>Jawapan rujukan guru</h2><p>{hypothesisOptions[1]}</p><ul><li>A: air, oksigen dan suhu sesuai hadir → bercambah.</li><li>B: tiada air → tidak bercambah.</li><li>C: oksigen tidak tersedia; minyak menghalang kemasukan semula oksigen → tidak bercambah.</li><li>D: suhu 5°C tidak sesuai → tidak bercambah.</li></ul>{analysisQuestions.map(q=><p key={q.id}><strong>{q.question}</strong><br/>{q.explanation}</p>)}<p>Kesimpulan: air + oksigen + suhu sesuai.</p></div>}
    {sample&&<div className="teacher-sample"><p className="info-strip">CONTOH SAHAJA — data sesi murid tidak diubah.</p><FinalReport exampleSession={demo}/></div>}
    <p className="small muted">PIN prototaip 1234 ialah kawalan kelas asas; perlindungan ini bukan pengesahan akaun selamat.</p>
    </>}</div>
  </FocusModal>;
}
