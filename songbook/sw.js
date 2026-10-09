/* Secret Songbook offline worker, made by tools/build_offline.py: don't edit by hand.
   Saves every file below on the first visit (pages, scores, fonts, recordings) and answers from that copy
   when there's no signal. Pages ask the network first, so an update shows the next time someone is online. */
const FILES = [["alive-again-score.js", "2d34d9c8d3"], ["alive-again.html", "fb36ac415f"], ["assets/baltic-sea.mp3", "54da406a6b"], ["assets/father.mp3", "28f238524d"], ["assets/fonts.css", "00ca2d6a43"], ["assets/fonts/atkinson-hyperlegible-latin-400-italic.woff2", "28700b8a79"], ["assets/fonts/atkinson-hyperlegible-latin-400-normal.woff2", "3201099022"], ["assets/fonts/atkinson-hyperlegible-latin-700-normal.woff2", "05dadf003f"], ["assets/fonts/atkinson-hyperlegible-latin-ext-400-italic.woff2", "ce11b2e53b"], ["assets/fonts/atkinson-hyperlegible-latin-ext-400-normal.woff2", "3a54aad037"], ["assets/fonts/atkinson-hyperlegible-latin-ext-700-normal.woff2", "97dbf56ced"], ["assets/fonts/staatliches-latin-400-normal.woff2", "1b473cb2ca"], ["assets/fonts/staatliches-latin-ext-400-normal.woff2", "20a937457f"], ["assets/icons/apple-touch-icon.png", "8dde9d4218"], ["assets/icons/favicon-32.png", "0f780eeec3"], ["assets/icons/icon-192.png", "6955c9dcd9"], ["assets/icons/icon-512.png", "37993e4353"], ["assets/icons/icon-maskable-512.png", "eed12cf41d"], ["assets/love-dont-keep-score.mp3", "88beed3e48"], ["assets/paper-boats.mp3", "238194ec8a"], ["assets/scc-logo.jpg", "7becb5ebff"], ["assets/vexflow-bravura.js", "14da811400"], ["baltic-sea-score.js", "85a4bd112e"], ["baltic-sea.html", "d6ce336fe8"], ["father-score.js", "6980030bef"], ["father.html", "6a901b243f"], ["love-dont-keep-score-score.js", "04c8a217fe"], ["love-dont-keep-score.html", "86233a5bcb"], ["manifest.webmanifest", "c26d27d8d3"], ["paper-boats-score.js", "77cf95f7e2"], ["paper-boats.html", "1925fe35bd"], ["songbook.html", "23cf781823"]];
const CACHE = 'secret-songbook';
const scopeURL = new URL('./', self.location).href;
const keyFor = (path, rev) => scopeURL + path + '?rev=' + rev;
const REV = Object.fromEntries(FILES);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const [path, rev] of FILES) {   // one at a time: gentle on a phone connection, and only what's new
      const key = keyFor(path, rev);
      if (await cache.match(key)) continue;
      try { const r = await fetch(scopeURL + path, { cache: 'reload' }); if (r.ok) await cache.put(key, r); } catch (err) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE), keep = new Set(FILES.map(([p, r]) => keyFor(p, r)));
    for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);   // older versions
    await self.clients.claim();
  })());
});

/* the audio player asks for byte ranges; answer those from the saved copy too */
async function ranged(req, res) {
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m) return res;
  const buf = await res.arrayBuffer(), size = buf.byteLength;
  const start = m[1] ? +m[1] : Math.max(0, size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`,
    'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(scopeURL)) return;
  const path = new URL(req.url).pathname.slice(new URL(scopeURL).pathname.length) || 'songbook.html';
  const rev = REV[path]; if (!rev) return;
  const key = keyFor(path, rev);
  if (path.endsWith('.html')) {   // pages: the network first (so updates show), the saved copy without signal
    e.respondWith(fetch(req).catch(async () => (await caches.match(key)) || Response.error()));
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(key);
    if (hit) return req.headers.has('range') ? ranged(req, hit) : hit;
    return fetch(req);
  })());
});
