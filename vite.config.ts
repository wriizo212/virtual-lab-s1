import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
// Build-time asset inventory keeps the offline cache atomic and versioned.
export default defineConfig({ plugins: [react(), {
  name:'virtual-lab-offline',
  apply:'build',
  generateBundle(_options,bundle) {
    const files=[...new Set(['index.html','favicon.svg','icon-192.png','icon-512.png','apple-touch-icon.png','manifest.webmanifest',...Object.keys(bundle).filter(name=>!name.endsWith('.map'))])];
    const hash=createHash('sha256');
    Object.values(bundle).forEach(file=>hash.update(file.type==='chunk'?file.code:file.source));
    ['favicon.svg','icon-192.png','icon-512.png','apple-touch-icon.png','manifest.webmanifest'].forEach(file=>hash.update(readFileSync(new URL(`./public/${file}`,import.meta.url))));
    const version=hash.digest('hex').slice(0,16);
    this.emitFile({type:'asset',fileName:'sw.js',source:`
const CACHE='sci1-lab-${version}';
const BASE=new URL('./',self.location).href;
const FILES=${JSON.stringify(files)}.map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sci1-lab-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(BASE))return;
  if(event.request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',BASE).href)).then(response=>response||fetch(event.request)));return;}
  // The static app has no personalized responses. Ignore Vary: Origin emitted
  // by preview hosts when module requests differ from install-time requests.
  if(FILES.includes(event.request.url))event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreVary:true})).then(response=>response||fetch(event.request)));
});`});
  },
}] });
