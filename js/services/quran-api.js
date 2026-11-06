/**
 * services/quran-api.js — Semua pengambilan data Al-Qur'an dari internet.
 *
 *  • Teks tiap halaman (JSON)        → GitHub (quran-qcf4)
 *  • Font mushaf per halaman (woff2) → jsDelivr
 *  • Terjemahan & peta ayat→halaman  → api.quran.com
 *
 * Semua hasil disimpan di memori (cache) agar tidak diunduh dua kali.
 * Service worker (sw.js) menyimpannya lagi di cache browser untuk dipakai luring.
 */
import { JSON_URL, FONT_URL, API_URL, TRANSLATION_ID, PAGES } from "../config.js";
import { fetchJson, pad3 } from "../core/utils.js";

const pageCache = new Map();         // halaman → Promise<data halaman>
const fontCache = new Map();         // nama font → Promise<FontFace>
const pageVerses = new Map();        // halaman → Set<verse_key> (indeks ayat tiap halaman)
const versePageCache = new Map();    // verse_key → nomor halaman
const translationCache = new Map();  // verse_key → teks terjemahan

/* ---------------------------------------------------------------
   Teks halaman
   --------------------------------------------------------------- */

/** Mencatat ayat-ayat apa saja yang ada di halaman `no`. */
function indexPage(no, data) {
  const set = new Set();
  data.lines.forEach(line => line.words.forEach(word => { if (word.verse_key) set.add(word.verse_key); }));
  pageVerses.set(no, set);
}

/** Mengambil data satu halaman (baris → kata). Hasil di-cache. */
export function loadPage(no) {
  if (!pageCache.has(no)) {
    const promise = fetchJson(JSON_URL + pad3(no) + ".json").then(data => {
      if (!data || !Array.isArray(data.lines)) throw new Error("Format halaman tidak valid");
      indexPage(no, data);
      return data;
    });
    promise.catch(() => pageCache.delete(no));   // gagal → boleh dicoba lagi nanti
    pageCache.set(no, promise);
  }
  return pageCache.get(no);
}

/** Apakah halaman `no` (yang sudah pernah dimuat) memuat ayat `key`? */
export function pageContainsVerse(no, key) {
  return !!(pageVerses.get(no) && pageVerses.get(no).has(key));
}

/* ---------------------------------------------------------------
   Font mushaf (setiap halaman punya font sendiri)
   --------------------------------------------------------------- */

/** Memuat satu font QCF dan mendaftarkannya ke dokumen. */
export function loadFont(name) {
  if (!fontCache.has(name)) {
    const file = name === "QCF4_QBSML" ? "QCF4_QBSML.woff2" : name + "_W.woff2";
    const promise = new FontFace(name, `url(${FONT_URL}${file})`).load().then(face => {
      document.fonts.add(face);
      return face;
    });
    promise.catch(() => fontCache.delete(name));
    fontCache.set(name, promise);
  }
  return fontCache.get(name);
}

/** Daftar nama font yang dibutuhkan oleh satu halaman. */
export function fontsOf(data) {
  const set = new Set();
  data.lines.forEach(line => line.words.forEach(word => {
    if (word.type !== "surah_header" && word.font) set.add(word.font);
  }));
  return [...set];
}

/* ---------------------------------------------------------------
   Peta ayat → halaman
   --------------------------------------------------------------- */

/** Mencari nomor halaman tempat ayat `key` berada (lewat Quran.com API). */
export async function fetchVersePage(key) {
  if (versePageCache.has(key)) return versePageCache.get(key);
  const res = await fetchJson(`${API_URL}/verses/by_key/${encodeURIComponent(key)}`, 1);
  const page = res && res.verse && res.verse.page_number;
  if (!(page >= 1 && page <= PAGES)) throw new Error("halaman tidak ditemukan");
  versePageCache.set(key, page);
  return page;
}

/* ---------------------------------------------------------------
   Terjemahan
   --------------------------------------------------------------- */

/** Menghapus tag HTML (mis. nomor catatan kaki <sup>) dari teks terjemahan. */
function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(String(html).replace(/<sup[^>]*>.*?<\/sup>/gi, ""), "text/html");
  return (doc.body.textContent || "").trim();
}

/** Terjemahan Indonesia (Kemenag) untuk satu ayat. */
export async function getTranslation(key) {
  if (translationCache.has(key)) return translationCache.get(key);
  const res = await fetchJson(`${API_URL}/quran/translations/${TRANSLATION_ID}?verse_key=${encodeURIComponent(key)}`, 1);
  const text = res && res.translations && res.translations[0] ? cleanHtml(res.translations[0].text) : "";
  if (!text) throw new Error("terjemahan kosong");
  translationCache.set(key, text);
  return text;
}
