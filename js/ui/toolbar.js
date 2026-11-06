/**
 * ui/toolbar.js — Toolbar di atas halaman: mode hafalan, tombol halaman, menu "lainnya",
 * serta dialog "Tentang" dan penutupan dialog secara umum.
 */
import { els } from "../core/dom.js";
import { cur } from "../reader/page-model.js";
import { S } from "../core/state.js";
import { goto } from "../reader/navigation.js";
import { setHideMode } from "../reader/selection.js";

/** Menutup menu "lainnya". */
export function closeActionMenu() {
  els.actionItems.hidden = true;
  els.btnMoreActions.setAttribute("aria-expanded", "false");
}

export function initToolbar() {
  // Mode hafalan (Normal / Tutup / Kata awal)
  els.modeGroup.addEventListener("click", e => {
    const button = e.target.closest("button[data-mode]");
    if (button) setHideMode(button.dataset.mode);
  });

  // Tombol halaman. Mushaf dibaca dari kanan: tombol KIRI = halaman berikutnya.
  els.pgNext.addEventListener("click", () => goto((cur.page || S.page) + 1));
  els.pgPrev.addEventListener("click", () => goto((cur.page || S.page) - 1));

  // Menu "lainnya" (titik tiga)
  els.btnMoreActions.addEventListener("click", () => {
    els.actionItems.hidden = !els.actionItems.hidden;
    els.btnMoreActions.setAttribute("aria-expanded", String(!els.actionItems.hidden));
  });
  els.actionItems.addEventListener("click", e => { if (e.target.closest("button")) closeActionMenu(); });
  document.addEventListener("click", e => {
    const clickedOutside = !els.actionItems.contains(e.target) && !els.btnMoreActions.contains(e.target);
    if (!els.actionItems.hidden && clickedOutside) closeActionMenu();
  });

  // Dialog "Tentang"
  els.btnAbout.addEventListener("click", () => els.dlgAbout.showModal());

  // Semua dialog: tombol [data-close] atau klik pada latar gelap menutup dialog
  document.addEventListener("click", e => {
    const closer = e.target.closest("[data-close]");
    if (closer) {
      const dialog = closer.closest("dialog");
      if (dialog) dialog.close();
      return;
    }
    if (e.target instanceof HTMLDialogElement && e.target.classList.contains("modal")) e.target.close();
  });
}
