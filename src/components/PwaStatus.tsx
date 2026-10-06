import { useEffect, useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
interface InstallEvent extends Event { prompt():Promise<void>; userChoice:Promise<{outcome:string}> }
export function PwaStatus() {
  const [offline,setOffline]=useState(!navigator.onLine),[ready,setReady]=useState(false),[error,setError]=useState(false);
  const [install,setInstall]=useState<InstallEvent|null>(null),[help,setHelp]=useState(false),[updating,setUpdating]=useState(false);
  useEffect(()=>{
    const online=()=>setOffline(!navigator.onLine);const prompt=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};const installed=()=>setInstall(null);
    window.addEventListener('online',online);window.addEventListener('offline',online);window.addEventListener('beforeinstallprompt',prompt);window.addEventListener('appinstalled',installed);
    let active=true;
    if(import.meta.env.PROD&&'serviceWorker' in navigator){navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(async reg=>{
      await navigator.serviceWorker.ready;if(active)setReady(true);
      const detect=()=>{if(reg.waiting&&navigator.serviceWorker.controller&&active)setUpdating(true);};detect();
      reg.addEventListener('updatefound',()=>reg.installing?.addEventListener('statechange',detect));
    }).catch(()=>{if(active)setError(true);});}
    else if(import.meta.env.PROD)setError(true);
    return()=>{active=false;window.removeEventListener('online',online);window.removeEventListener('offline',online);window.removeEventListener('beforeinstallprompt',prompt);window.removeEventListener('appinstalled',installed);};
  },[]);
  return <div className="pwa-status"><span role="status">{offline?<><WifiOff size={15}/>Anda sedang offline{ready?' · cache tersedia':''}</>:ready?'✓ Aplikasi tersedia offline':error?'Cache offline gagal. Cuba muat semula.':import.meta.env.PROD?'Menyediakan cache offline…':'Pratonton pembangunan · offline pada build production'}</span><button className="text-button" onClick={async()=>{if(install){await install.prompt();await install.userChoice;setInstall(null);}else setHelp(!help);}}><Download size={16}/>Pasang aplikasi</button>{help&&<p>Android / Chrome: menu browser → Pasang aplikasi. iPad / Safari: Kongsi → Tambah ke Skrin Utama. Gunakan laman HTTPS atau localhost. Muatkan sekali sehingga status offline tersedia.</p>}{updating&&<p>Versi baharu tersedia. <button className="text-button" onClick={async()=>{const reg=await navigator.serviceWorker.getRegistration();if(reg?.waiting){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});reg.waiting.postMessage('ACTIVATE_UPDATE');}}}>Muat semula versi baharu</button></p>}</div>;
}
