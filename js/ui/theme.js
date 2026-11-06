/**
 * ui/theme.js — Tema warna, lebar halaman, dan "jaga layar tetap menyala".
 */
import { els } from "../core/dom.js";
import { PREFERS_DARK } from "../core/media.js";
import { S, persist } from "../core/state.js";
import { fitSoon } from "../reader/fit.js";
import { cur } from "../reader/page-model.js";

const THEME_COLOR = { light: "#f3f2ed", dark: "#191816", sepia: "#e5dac5" };   // warna bilah status browser
const THEME_ICON  = { auto: "#i-auto", light: "#i-sun", dark: "#i-moon", sepia: "#i-leaf" };
const THEME_NAME  = { auto: "Otomatis", light: "Terang", dark: "Gelap", sepia: "Sepia" };
const THEME_CYCLE = ["light", "dark", "sepia", "auto"];   // urutan saat tombol Tema diketuk

/** Menerapkan tema pilihan pengguna ke seluruh halaman. */
export function applyTheme() {
  const preference = S.settings.theme;
  const actual = preference === "auto" ? (PREFERS_DARK.matches ? "dark" : "light") : preference;

  document.documentElement.dataset.theme = actual;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[actual]);

  els.themeIcon.setAttribute("href", THEME_ICON[preference]);
  els.themeLabel.textContent = THEME_NAME[preference];
  els.btnTheme.title = `Tema: ${THEME_NAME[preference].toLowerCase()} (ketuk untuk mengganti)`;
  document.querySelectorAll('input[name="theme"]').forEach(r => { r.checked = r.value === preference; });
}

/** Menerapkan lebar halaman mushaf dari pengaturan. */
export function applyWidth() {
  document.documentElement.style.setProperty("--w", S.settings.width + "px");
  els.setWidth.value = S.settings.width;
  els.setWidthVal.textContent = S.settings.width + " px";
  if (cur.page) fitSoon();
}

/* ---------- Jaga layar tetap menyala (Wake Lock) ---------- */
let wakeLock = null;

export async function syncWake() {
  try {
    if (S.settings.wake && "wakeLock" in navigator && document.visibilityState === "visible") {
      if (!wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      }
    } else if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { /* tidak didukung atau ditolak */ }
}

export function initTheme() {
  // Tema "Otomatis" mengikuti pengaturan sistem operasi
  if (PREFERS_DARK.addEventListener) {
    PREFERS_DARK.addEventListener("change", () => { if (S.settings.theme === "auto") applyTheme(); });
  }

  // Tombol Tema di menu: ganti berurutan
  els.btnTheme.addEventListener("click", () => {
    S.settings.theme = THEME_CYCLE[(THEME_CYCLE.indexOf(S.settings.theme) + 1) % THEME_CYCLE.length];
    persist();
    applyTheme();
  });

  // Pilihan tema di dialog Pengaturan
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      S.settings.theme = radio.value;
      persist();
      applyTheme();
    });
  });

  // Geser lebar halaman: tampilkan langsung, simpan saat dilepas
  els.setWidth.addEventListener("input", () => { S.settings.width = Number(els.setWidth.value); applyWidth(); });
  els.setWidth.addEventListener("change", persist);

  document.addEventListener("visibilitychange", syncWake);
}
