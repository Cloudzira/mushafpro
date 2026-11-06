/**
 * core/dom.js — Akses elemen HTML.
 *
 *  • $ / $$  : jalan pintas untuk mencari elemen
 *  • h()     : membuat elemen baru dengan aman (memakai textContent, bukan innerHTML)
 *  • icon()  : membuat ikon SVG dari sprite di index.html
 *  • els     : kumpulan elemen penting, diambil sekali berdasarkan id
 */

/** Elemen dengan id tertentu. */
export const $ = id => document.getElementById(id);

/** Semua elemen yang cocok dengan selector CSS, sebagai array. */
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Membuat elemen: h("div", "kelas", "teks").
 * Memakai textContent sehingga aman dari penyisipan HTML.
 */
export function h(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

/** Membuat ikon SVG yang merujuk ke <symbol id="i-NAMA"> pada sprite di index.html. */
export function icon(name, extraClass) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "ik" + (extraClass ? " " + extraClass : ""));
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("href", "#i-" + name);
  svg.appendChild(use);
  return svg;
}

/** Daftar id elemen yang sering dipakai (harus ada di index.html). */
const ELEMENT_IDS = [
  // kerangka halaman
  "splash", "frame", "teks", "kepala", "kaki", "kSurah", "kJuz", "kNo", "readBar", "readProgress", "toasts", "appVersion",
  // bilah atas & toolbar
  "btnAbout", "userStatus", "authBtn", "modeGroup", "pgPrev", "pgNext", "btnNavOpen", "navLabel",
  "btnBookmark", "btnMemo", "btnMoreActions", "actionItems",
  "btnBookmarks", "btnProgress", "btnTheme", "themeIcon", "themeLabel", "btnSettings", "btnInstall",
  // kartu ayat
  "ayatSheet", "asKey", "asText", "asPlay", "asDrill", "asFrom", "asClose",
  // pemutar audio
  "player", "plBar", "plPrev", "plPlay", "plPlayIcon", "plNext", "plStop", "plTitle", "plSub", "plMore", "plPanel",
  "selQari", "selMode", "rngWrap", "rngSurah", "rngFrom", "rngTo", "selRepAyat", "selRepRange", "selSpeed", "selGap",
  // dialog
  "dlgAbout", "dlgNav", "dlgBm", "dlgPrg", "dlgSet",
  // navigasi
  "tabSurat", "tabJuz", "tabAyat", "tabHalaman", "panSurat", "panJuz", "panAyat", "panHalaman",
  "navSearch", "listSurat", "gridJuz", "ayatSurah", "ayatNo", "ayatGo", "pageNo", "pageGo",
  // penanda & progres
  "bmList", "bmAdd", "prgText", "prgBar", "prgPct", "prgJuz", "prgMark",
  // pengaturan
  "setWidth", "setWidthVal", "setReveal", "setTrans", "setWake",
  "btnExport", "btnImport", "btnReset", "btnDiag", "fileImport"
];

export const els = {};
ELEMENT_IDS.forEach(id => {
  els[id] = $(id);
  if (!els[id]) console.warn(`Elemen #${id} tidak ditemukan di index.html`);
});
