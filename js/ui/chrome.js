/**
 * ui/chrome.js — "Bingkai" aplikasi yang berubah mengikuti halaman:
 * judul kepala/kaki halaman, label navigasi, status tombol, dan bilah posisi bacaan.
 */
import { APP, PAGES } from "../config.js";
import { surahName } from "../data/surah.js";
import { els } from "../core/dom.js";
import { on } from "../core/events.js";
import { S } from "../core/state.js";
import { juzOf, toAr } from "../core/utils.js";
import { cur } from "../reader/page-model.js";

/** Menyegarkan semua teks & tombol yang bergantung pada halaman saat ini. */
export function updateChrome() {
  const page = cur.page || S.page;
  const names = cur.surahs.map(s => surahName(s.id));
  const firstName = names[0] || "";

  // Kepala & kaki halaman mushaf
  els.kSurah.textContent = names.join(" · ");
  els.kJuz.textContent = "Juz " + juzOf(page);
  els.kNo.textContent = toAr(page);
  els.kaki.classList.toggle("hafal", !!S.memorized[page]);

  // Tombol navigasi
  els.navLabel.textContent = (firstName || "Pilih surat") + " · " + page;
  els.pgPrev.disabled = page <= 1;
  els.pgNext.disabled = page >= PAGES;

  // Penanda & tanda hafal
  const isBookmarked = S.bookmarks.some(b => b.page === page);
  const isMemorized = !!S.memorized[page];
  els.btnBookmark.setAttribute("aria-pressed", String(isBookmarked));
  els.btnBookmark.title = isBookmarked ? "Hapus penanda halaman ini (B)" : "Simpan penanda halaman (B)";
  els.btnMemo.setAttribute("aria-pressed", String(isMemorized));
  els.btnMemo.title = isMemorized ? "Batalkan tanda hafal (M)" : "Tandai halaman ini sudah hafal (M)";

  // Bilah posisi bacaan (terisi dari kanan, seperti membuka mushaf)
  els.readBar.style.width = (page / PAGES * 100) + "%";
  els.readProgress.setAttribute("aria-valuenow", String(page));

  document.title = `Hal. ${page} · ${firstName || "Mushaf"} — ${APP.name}`;
}

export function initChrome() {
  els.appVersion.textContent = APP.version;
  on("page:rendered", updateChrome);
  on("state:replaced", updateChrome);
}
