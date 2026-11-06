/**
 * reader/selection.js — Mode hafalan, pemilihan ayat, dan penyorotan ayat yang diputar.
 *
 * Istilah:
 *  • mode hafalan : "normal" (semua terlihat), "blur" (semua kata dikaburkan),
 *                   "first" (hanya kata pertama tiap ayat yang terlihat)
 *  • terbuka      : kata yang sudah diketuk sehingga terlihat walau sedang mode hafalan
 *  • sel          : ayat yang dipilih pengguna (diketuk)
 *  • putar        : ayat yang sedang dibacakan audio
 */
import { OPTIONS } from "../config.js";
import { els, $$ } from "../core/dom.js";
import { emit, on } from "../core/events.js";
import { S, persist } from "../core/state.js";
import { cur } from "./page-model.js";
import { keepInViewSoon, syncSheetSpace } from "./viewport.js";

let playingKey = null;     // ayat yang sedang diputar audio
let highlightKey = null;   // ayat yang sedang disorot

/** Ayat yang sedang diputar (atau null). */
export const getPlayingKey = () => playingKey;

/* ---------------------------------------------------------------
   Mode hafalan
   --------------------------------------------------------------- */

/** Menerapkan mode hafalan ke halaman & memperbarui tombol pilihan mode. */
export function applyHideMode() {
  const mode = S.settings.hideMode;
  els.teks.classList.toggle("m-blur", mode === "blur");
  els.teks.classList.toggle("m-first", mode === "first");
  $$(".kata.terbuka", els.teks).forEach(k => k.classList.remove("terbuka"));
  $$("#modeGroup button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
}

export function setHideMode(mode) {
  if (!OPTIONS.hideMode.includes(mode)) return;
  S.settings.hideMode = mode;
  persist();
  applyHideMode();
}

/** Apakah kata ini sedang tertutup (kabur)? */
function isHiddenWord(word) {
  const mode = S.settings.hideMode;
  if (word.classList.contains("is-end") || word.classList.contains("terbuka")) return false;
  if (mode === "blur") return true;
  if (mode === "first") return !word.classList.contains("is-first");
  return false;
}

/** Buka / tutup seluruh kata dalam satu ayat. */
function toggleVerse(key) {
  const words = cur.words.get(key) || [];
  const allOpen = words.every(w => w.classList.contains("terbuka"));
  words.forEach(w => w.classList.toggle("terbuka", !allOpen));
}

/** Membuka seluruh kata dalam satu ayat (dipakai saat audio memutarnya). */
export function revealVerse(key) {
  (cur.words.get(key) || []).forEach(w => w.classList.add("terbuka"));
}

/* ---------------------------------------------------------------
   Pemilihan ayat
   --------------------------------------------------------------- */

function syncSelClass() {
  els.teks.classList.toggle("ada-sel", !!cur.sel);
}

export function clearSel() {
  if (cur.sel) (cur.words.get(cur.sel) || []).forEach(w => w.classList.remove("sel"));
  cur.sel = null;
  syncSelClass();
}

/**
 * Memilih ayat `key`. opts.sheet = false → jangan tampilkan kartu ayat.
 */
export function selectVerse(key, opts = {}) {
  clearSel();
  cur.sel = key;
  (cur.words.get(key) || []).forEach(w => w.classList.add("sel"));
  syncSelClass();
  if (opts.sheet !== false) emit("sheet:show", key);
  keepInViewSoon(key);
}

/* ---------------------------------------------------------------
   Penyorotan ayat yang sedang diputar
   --------------------------------------------------------------- */

function setHighlight(key) {
  if (highlightKey && highlightKey !== key) {
    (cur.words.get(highlightKey) || []).forEach(w => w.classList.remove("putar"));
  }
  highlightKey = key;
  if (key) (cur.words.get(key) || []).forEach(w => w.classList.add("putar"));
}

/** Dipanggil mesin audio setiap ayat yang diputar berganti (key = null saat berhenti). */
export function markPlaying(key) {
  const changed = key !== playingKey;
  playingKey = key;
  if (changed) setHighlight(key);
  if (key && changed) keepInViewSoon(key);
}

/** Setelah halaman baru digambar: pasang kembali sorotan pilihan & audio bila ayatnya ada di halaman ini. */
export function reapplyMarks() {
  if (cur.sel) {
    if (cur.words.has(cur.sel)) {
      cur.words.get(cur.sel).forEach(w => w.classList.add("sel"));
    } else {
      cur.sel = null;               // ayat terpilih ada di halaman lain
      emit("sheet:hide");
      syncSheetSpace();
    }
  }
  syncSelClass();
  if (highlightKey && cur.words.has(highlightKey)) {
    cur.words.get(highlightKey).forEach(w => w.classList.add("putar"));
  }
}

/* ---------------------------------------------------------------
   Interaksi: ketuk / tekan Enter pada kata
   --------------------------------------------------------------- */
export function initSelection() {
  els.teks.addEventListener("click", e => {
    const word = e.target.closest(".kata");
    if (!word || !els.teks.contains(word)) return;
    const key = word.dataset.v;

    if (word.classList.contains("is-end")) {      // tanda akhir ayat: buka/tutup ayat + pilih
      if (key) { toggleVerse(key); selectVerse(key); }
      return;
    }
    if (isHiddenWord(word)) { word.classList.add("terbuka"); return; }   // kata kabur: buka dulu
    if (key) selectVerse(key);
  });

  // Akses papan ketik: Enter / Spasi pada tanda akhir ayat sama dengan mengetuknya
  els.teks.addEventListener("keydown", e => {
    const isActivationKey = e.key === "Enter" || e.key === " ";
    if (isActivationKey && e.target.classList && e.target.classList.contains("is-end")) {
      e.preventDefault();
      e.target.click();
    }
  });

  // Setelah halaman digambar: terapkan mode hafalan & sorotan
  // (urutan dua pemanggilan ini tidak saling bergantung)
  on("page:rendered", () => { applyHideMode(); reapplyMarks(); });
}
