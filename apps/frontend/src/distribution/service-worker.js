/* Generado con versión y hashes. Una instalación incompleta no sustituye la anterior. */
const BUILD=__BUILD__,FILES=__FILES__;
const BASE=new URL(self.registration.scope);
const PREFIX='nexolineal:'+BASE.pathname+':';
const CACHE=PREFIX+BUILD.build_id;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);let done=0;
 const meta={started:Date.now(),complete:false};
 await cache.put(new URL('__offline_meta__',BASE),new Response(JSON.stringify(meta)));
 try{
  // Pocas descargas simultáneas limitan memoria en teléfonos y redes inestables.
  for(let start=0;start<FILES.length;start+=6){await Promise.all(FILES.slice(start,start+6).map(async file=>{
   const url=new URL(file.url,BASE);const response=await fetch(url,{cache:'reload'});
   if(!response.ok)throw new Error('No se completó la descarga offline.');
   const bytes=await response.clone().arrayBuffer();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   if(hash!==file.sha256)throw new Error('Los recursos no corresponden a la misma versión.');
   await cache.put(url,response);done++;
   for(const client of await self.clients.matchAll({includeUncontrolled:true,type:'window'}))client.postMessage({type:'NEXO_DOWNLOAD',done,total:FILES.length});
  }));}
  await cache.put(new URL('__offline_meta__',BASE),new Response(JSON.stringify({...meta,complete:true})));
 }catch(error){await caches.delete(CACHE);throw error;}
 // No skipWaiting: ninguna pestaña mezcla el motor anterior con el nuevo.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const current=await (await (await caches.open(CACHE)).match(new URL('__offline_meta__',BASE))).json();
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE){
  const previous=await (await caches.open(key)).match(new URL('__offline_meta__',BASE));
  if(previous&&(await previous.json()).started<current.started)await caches.delete(key);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const key=event.request.mode==='navigate'?new URL('index.html',BASE):new URL(url.pathname,BASE.origin);
  const stored=await cache.match(key);
  return stored||fetch(event.request);
 })());
});
