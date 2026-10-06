
const CACHE='sci1-lab-d4a8a1a222ece2d9';
const BASE=new URL('./',self.location).href;
const FILES=["index.html","favicon.svg","icon-192.png","icon-512.png","apple-touch-icon.png","manifest.webmanifest","assets/index-DZcHFQza.css","assets/index-DseHGArq.js"].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sci1-lab-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(BASE))return;
  if(event.request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',BASE).href)).then(response=>response||fetch(event.request)));return;}
  // The static app has no personalized responses. Ignore Vary: Origin emitted
  // by preview hosts when module requests differ from install-time requests.
  if(FILES.includes(event.request.url))event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreVary:true})).then(response=>response||fetch(event.request)));
});