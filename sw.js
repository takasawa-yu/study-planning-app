// 資格スタディ Service Worker
// 方針: index.html は network-first（常に最新を取りに行き、オフライン時のみキャッシュ）、
// アイコン等の静的アセットは cache-first。これにより「更新が届かない」事故を避けつつ
// オフラインでも起動できる。データ自体はアプリの localStorage にあり SW は関与しない。
const CACHE = "shikaku-study-v1";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    // network-first: 最新のindex.htmlを優先、失敗したらキャッシュ
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html"))
    );
  } else {
    // cache-first: 静的アセット
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
