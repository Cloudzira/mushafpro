/**
 * sw.js — Service worker Mushaf Tahfidz Pro.
 *
 * Tugasnya: membuat aplikasi tetap bisa dibuka tanpa internet.
 *
 *  • Berkas aplikasi (HTML/CSS/JS): JARINGAN DULU, cache hanya cadangan luring.
 *    Dengan begitu pembaruan kode langsung terpakai (tidak ada versi lama yang "menempel").
 *  • Data halaman, font, terjemahan: CACHE DULU (isinya tidak berubah) →
 *    bisa dibaca luring setelah dibuka sekali.
 *  • Audio (everyayah.com) & Firebase: tidak disentuh, langsung ke jaringan.
 *
 * PENTING: bila menambah/menghapus berkas CSS atau JS, perbarui daftar SHELL
 * di bawah dan naikkan VERSION agar cache lama dibersihkan.
 */
const VERSION = "v9";
const SHELL_CACHE = "mushaf-shell-" + VERSION;
const DATA_CACHE = "mushaf-data-" + VERSION;

const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "css/01-tokens.css",
  "css/02-base.css",
  "css/03-layout.css",
  "css/04-mushaf.css",
  "css/05-components.css",
  "css/06-dialogs.css",
  "css/07-player.css",
  "css/08-responsive.css",
  "js/audio/player.js",
  "js/audio/sources.js",
  "js/config.js",
  "js/core/dom.js",
  "js/core/events.js",
  "js/core/logger.js",
  "js/core/media.js",
  "js/core/state.js",
  "js/core/storage.js",
  "js/core/utils.js",
  "js/data/juz.js",
  "js/data/reciters.js",
  "js/data/surah.js",
  "js/main.js",
  "js/reader/ayat-sheet.js",
  "js/reader/fit.js",
  "js/reader/navigation.js",
  "js/reader/page-model.js",
  "js/reader/renderer.js",
  "js/reader/selection.js",
  "js/reader/viewport.js",
  "js/services/cloud.js",
  "js/services/pwa.js",
  "js/services/quran-api.js",
  "js/ui/bookmarks.js",
  "js/ui/chrome.js",
  "js/ui/navigator.js",
  "js/ui/progress.js",
  "js/ui/settings.js",
  "js/ui/shortcuts.js",
  "js/ui/theme.js",
  "js/ui/toast.js",
  "js/ui/toolbar.js"
];

// Server data yang aman di-cache selamanya
const DATA_HOSTS = [
  "raw.githubusercontent.com",
  "cdn.jsdelivr.net",
  "api.quran.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
];

/* Pemasangan: simpan seluruh berkas aplikasi ke cache */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => Promise.all(SHELL.map(url =>
        // cache: "reload" → ambil dari jaringan, bukan dari cache HTTP browser
        fetch(new Request(url, { cache: "reload" }))
          .then(res => { if (res.ok) return cache.put(url, res); })
          .catch(() => {})
      )))
      .then(() => self.skipWaiting())
  );
});

/* Aktivasi: hapus cache versi lama */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith("mushaf-") && k !== SHELL_CACHE && k !== DATA_CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isCacheable = res => res && (res.ok || res.type === "opaque");

/* Setiap permintaan jaringan */
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Data eksternal: cache dulu
  if (DATA_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (isCacheable(res)) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Berkas aplikasi: jaringan dulu, cache sebagai cadangan luring
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async cache => {
        try {
          const res = await fetch(req, { cache: "no-cache" });
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (err) {
          const hit = await cache.match(req, { ignoreSearch: true });
          if (hit) return hit;
          throw err;
        }
      })
    );
  }
  // Selain itu (audio, Firebase, dll.): langsung ke jaringan
});
