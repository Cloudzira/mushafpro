/**
 * main.js — Titik masuk aplikasi Mushaf Tahfidz Pro.
 *
 * File ini hanya bertugas MENYALAKAN modul-modul lain dengan urutan yang benar.
 * Logika sebenarnya ada di folder:
 *   data/      → data surat, juz, qari
 *   core/      → fungsi bantu, penyimpanan, state
 *   services/  → layanan luar (API Qur'an, Firebase, PWA)
 *   reader/    → tampilan & interaksi halaman mushaf
 *   audio/     → pemutar audio
 *   ui/        → toolbar, dialog, pengaturan, dll.
 */
import { els } from "./core/dom.js";
import { S } from "./core/state.js";
import { installErrorLogging } from "./core/logger.js";

import { initInstall, registerServiceWorker } from "./services/pwa.js";
import { initCloud } from "./services/cloud.js";

import { goto } from "./reader/navigation.js";
import { initFitObserver } from "./reader/fit.js";
import { initSelection, applyHideMode } from "./reader/selection.js";
import { initAyatSheet } from "./reader/ayat-sheet.js";

import { initPlayer } from "./audio/player.js";

import { initChrome } from "./ui/chrome.js";
import { initTheme, syncWake } from "./ui/theme.js";
import { initToolbar } from "./ui/toolbar.js";
import { initNavigator } from "./ui/navigator.js";
import { initBookmarks, renderBookmarks } from "./ui/bookmarks.js";
import { initProgress } from "./ui/progress.js";
import { initSettings, syncControls } from "./ui/settings.js";
import { initShortcuts } from "./ui/shortcuts.js";

/** Menyembunyikan layar pembuka dengan transisi halus. */
function hideSplash() {
  els.splash.classList.add("splash-hilang");
  setTimeout(() => { els.splash.hidden = true; }, 400);
}

async function init() {
  installErrorLogging();

  // 1) Pasang semua pendengar event & bangun daftar (belum ada yang diunduh)
  initInstall();
  initChrome();
  initFitObserver();
  initSelection();
  initAyatSheet();
  initPlayer();
  initTheme();
  initToolbar();
  initNavigator();
  initBookmarks();
  initProgress();
  initSettings();
  initShortcuts();

  // 2) Samakan tampilan dengan data tersimpan
  syncControls();
  applyHideMode();
  renderBookmarks();
  syncWake();

  // 3) Layanan latar belakang (tidak menghalangi tampilan)
  initCloud();
  registerServiceWorker();

  // 4) Buka halaman terakhir yang dibaca
  try {
    await goto(S.page, { auto: true });
  } finally {
    hideSplash();
  }
}

init();
