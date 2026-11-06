/**
 * reader/navigation.js — Berpindah halaman.
 */
import { PAGES } from "../config.js";
import { surahStartPage } from "../data/surah.js";
import { S, persist } from "../core/state.js";
import { idle, parseKey } from "../core/utils.js";
import { loadPage, loadFont, fontsOf, pageContainsVerse, fetchVersePage } from "../services/quran-api.js";
import { cur } from "./page-model.js";
import { render } from "./renderer.js";

let requestId = 0;           // nomor permintaan terakhir; dipakai untuk membatalkan render yang kedaluwarsa
let userNavigated = false;   // sudah pernah berpindah halaman secara manual?

/** Apakah pengguna sudah berpindah halaman sendiri? (agar sinkron awan tidak "menarik" layar) */
export const hasUserNavigated = () => userNavigated;

/**
 * Membuka halaman `no`.
 * opts.auto = true → perpindahan otomatis (bukan dari pengguna), mis. saat audio lanjut ke halaman berikut.
 *
 * Catatan: audio TIDAK dihentikan saat pindah halaman. Audio berhenti hanya lewat
 * tombol stop/jeda atau ketika pengguna memutar ayat lain.
 */
export async function goto(no, opts = {}) {
  no = Math.round(Number(no));
  if (!(no >= 1 && no <= PAGES)) return false;

  const myRequest = ++requestId;
  if (!opts.auto) userNavigated = true;

  S.page = no;
  persist();

  const isStale = () => myRequest !== requestId;
  const retry = () => goto(S.page, { auto: true });
  const ok = await render(no, isStale, retry);

  if (ok && !isStale()) prefetchNeighbours(no);
  return ok;
}

/** Mengunduh halaman sebelum/sesudahnya diam-diam agar pindah halaman terasa instan. */
function prefetchNeighbours(no) {
  if (navigator.connection && navigator.connection.saveData) return;   // hormati mode hemat data
  idle(() => {
    [no + 1, no - 1].forEach(n => {
      if (n < 1 || n > PAGES) return;
      loadPage(n).then(data => Promise.all(fontsOf(data).map(loadFont))).catch(() => {});
    });
  });
}

/**
 * Mencari nomor halaman untuk ayat `key` ("surat:ayat").
 * Urutan pencarian dari yang tercepat: awal surat → halaman tetangga → Quran.com API.
 */
export async function versePage(key) {
  const [surahId, ayah] = parseKey(key);
  if (ayah === 1) return surahStartPage(surahId);
  for (const n of [cur.page + 1, cur.page - 1]) {
    if (pageContainsVerse(n, key)) return n;
  }
  return fetchVersePage(key);
}

