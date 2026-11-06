/**
 * ui/shortcuts.js — Pintasan papan ketik & geser layar untuk membalik halaman.
 *
 *   ←  halaman berikutnya      →  halaman sebelumnya
 *   Spasi  putar / jeda        1 2 3  mode Normal / Tutup / Kata awal
 *   B  penanda                 M  tandai hafal
 *   /  navigasi                Esc  tutup kartu ayat / menu
 */
import { els } from "../core/dom.js";
import { cur } from "../reader/page-model.js";
import { goto } from "../reader/navigation.js";
import { setHideMode } from "../reader/selection.js";
import { closeSheet } from "../reader/ayat-sheet.js";
import { togglePlay } from "../audio/player.js";
import { toggleBookmark, toggleMemo } from "./bookmarks.js";
import { openNavigator } from "./navigator.js";
import { closeActionMenu } from "./toolbar.js";

function initKeyboard() {
  document.addEventListener("keydown", e => {
    // Esc menutup menu "lainnya" lebih dulu
    if (e.key === "Escape" && !els.actionItems.hidden) { closeActionMenu(); return; }

    // Abaikan bila sedang mengetik, ada dialog terbuka, atau memakai tombol modifier
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "select", "textarea"].includes(tag) || document.querySelector("dialog[open]")) return;
    if (tag === "button" && (e.key === " " || e.key === "Enter")) return;   // biarkan tombol bekerja normal

    switch (e.key) {
      case "ArrowLeft":  goto(cur.page + 1); break;   // mushaf dibaca dari kanan: kiri = berikutnya
      case "ArrowRight": goto(cur.page - 1); break;
      case " ":          e.preventDefault(); togglePlay(); break;
      case "1":          setHideMode("normal"); break;
      case "2":          setHideMode("blur"); break;
      case "3":          setHideMode("first"); break;
      case "b": case "B": toggleBookmark(); break;
      case "m": case "M": toggleMemo(); break;
      case "/":          e.preventDefault(); openNavigator("surat"); break;
      case "Escape":     if (!els.ayatSheet.hidden) closeSheet(); break;
      default: return;
    }
  });
}

/** Geser horizontal pada halaman = membalik halaman (geser ke kanan = halaman berikutnya). */
function initSwipe() {
  let startX = 0, startY = 0, startTime = 0;

  els.frame.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  }, { passive: true });

  els.frame.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const tooSlow = Date.now() - startTime > 700;
    const tooShort = Math.abs(dx) < 70;
    const mostlyVertical = Math.abs(dx) < Math.abs(dy) * 1.6;
    if (tooSlow || tooShort || mostlyVertical) return;
    goto(dx > 0 ? cur.page + 1 : cur.page - 1);
  }, { passive: true });
}

export function initShortcuts() {
  initKeyboard();
  initSwipe();
}
