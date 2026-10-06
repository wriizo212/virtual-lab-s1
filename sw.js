
const CACHE='sci1-lab-c145a59fb82c52db';
const BASE=new URL('./',self.location).href;
const FILES=["index.html","favicon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","manifest.webmanifest","panduan-kelas.html","assets/index-0io8WWIR.css","assets/index-re6MUpT9.js","assets/CodeScanner-frHE7GLz.js","assets/browser-Bqbm94D8.js"].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sci1-lab-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(BASE))return;
  // Navigations go to the network first and fall back to cache; the cached
  // copy of the requested file is preferred (keeps panduan-kelas.html working)
  // before the app shell index.html.
  if(event.request.mode==='navigate'){event.respondWith((async()=>{const cache=await caches.open(CACHE);try{return await fetch(event.request);}catch{return (await cache.match(event.request,{ignoreVary:true}))||(await cache.match(new URL('index.html',BASE).href));}})());return;}
  // The static app has no personalized responses. Ignore Vary: Origin emitted
  // by preview hosts when module requests differ from install-time requests.
  if(FILES.includes(event.request.url))event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreVary:true})).then(response=>response||fetch(event.request)));
});