/**
 * reader/ayat-sheet.js — Kartu kecil di bawah layar untuk ayat terpilih
 * (nama ayat, terjemahan, dan tombol putar / latih hafalan).
 */
import { els } from "../core/dom.js";
import { on } from "../core/events.js";
import { S } from "../core/state.js";
import { keysRange, labelKey, parseKey } from "../core/utils.js";
import { surahVerseCount } from "../data/surah.js";
import { getTranslation } from "../services/quran-api.js";
import { startPlayback } from "../audio/player.js";
import { cur } from "./page-model.js";
import { clearSel } from "./selection.js";
import { keepInViewSoon, syncSheetSpace } from "./viewport.js";

/** Menampilkan kartu untuk ayat `key` lalu memuat terjemahannya. */
export async function showSheet(key) {
  els.asKey.textContent = labelKey(key);
  els.ayatSheet.hidden = false;

  if (!S.settings.showTranslation) { els.asText.textContent = ""; return; }

  els.asText.textContent = "Memuat terjemahan…";
  try {
    const text = await getTranslation(key);
    if (cur.sel === key) { els.asText.textContent = text; keepInViewSoon(key); }   // pastikan ayat belum berganti
  } catch {
    if (cur.sel === key) {
      els.asText.textContent = "Terjemahan belum tersedia (periksa koneksi internet).";
      keepInViewSoon(key);
    }
  }
}

/** Menyembunyikan kartu (tanpa membatalkan pilihan ayat). */
export function hideSheet() {
  els.ayatSheet.hidden = true;
  syncSheetSpace();
}

/** Menutup kartu sekaligus membatalkan pilihan ayat. */
export function closeSheet() {
  hideSheet();
  clearSel();
}

export function initAyatSheet() {
  on("sheet:show", showSheet);
  on("sheet:hide", hideSheet);

  els.asClose.addEventListener("click", closeSheet);

  // Putar ayat ini saja
  els.asPlay.addEventListener("click", () => {
    if (cur.sel) startPlayback([cur.sel], { repeatRange: 1 });
  });

  // Latih hafalan: putar → jeda sepanjang ayat (giliran Anda) → ulangi 5×
  els.asDrill.addEventListener("click", () => {
    if (cur.sel) startPlayback([cur.sel], { repeatAyah: 5, gap: -1, repeatRange: 1 });
  });

  // Lanjut dari ayat ini sampai akhir surat
  els.asFrom.addEventListener("click", () => {
    if (!cur.sel) return;
    const [surahId, ayah] = parseKey(cur.sel);
    startPlayback(keysRange(surahId, ayah, surahVerseCount(surahId)));
  });
}
