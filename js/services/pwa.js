/**
 * services/pwa.js — Pemasangan aplikasi (PWA) & service worker.
 *
 * PWA = situs yang bisa dipasang seperti aplikasi dan tetap berjalan tanpa internet.
 */
import { APP } from "../config.js";
import { els } from "../core/dom.js";
import { isStandalone } from "../core/media.js";
import { toast } from "../ui/toast.js";

let installPrompt = null;      // peristiwa "beforeinstallprompt" yang disimpan sampai pengguna menekan tombol
let appInstalled = false;

/** Tombol "Pasang aplikasi" disembunyikan bila aplikasi sudah terpasang. */
function syncInstallButton() {
  els.btnInstall.hidden = appInstalled || isStandalone();
}

/** Mendaftarkan semua pendengar terkait pemasangan. Panggil sekali saat mulai. */
export function initInstall() {
  syncInstallButton();

  const standalone = window.matchMedia("(display-mode: standalone)");
  if (standalone.addEventListener) standalone.addEventListener("change", syncInstallButton);

  // Chrome/Edge/Android memberi tahu bahwa aplikasi bisa dipasang
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e;
    syncInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    appInstalled = true;
    installPrompt = null;
    syncInstallButton();
    toast(`${APP.name} berhasil diinstal`);
  });

  els.btnInstall.addEventListener("click", installApp);
}

/** Menampilkan dialog pasang bawaan browser, atau petunjuk manual bila tidak tersedia. */
async function installApp() {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") toast("Permintaan instal dikirim");
    return;
  }

  // Safari tidak punya dialog otomatis → beri petunjuk manual
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|android/i.test(ua);
  if (isIos && isSafari) toast("Safari: ketuk Bagikan, lalu pilih Tambahkan ke Layar Utama.", { ms: 8000 });
  else if (isSafari) toast("Safari: pilih File, lalu Tambahkan ke Dock.", { ms: 8000 });
  else toast("Buka menu browser lalu pilih Instal aplikasi atau Tambahkan ke layar utama.", { ms: 8000 });
}

/** Mendaftarkan service worker (hanya pada http/https; tidak berlaku untuk file://). */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* tidak kritis */ });
  });
}
