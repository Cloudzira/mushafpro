/**
 * ui/settings.js — Dialog Pengaturan: opsi tampilan, cadangan data, diagnostik, dan reset.
 */
import { APP, STORAGE_KEY, UID_KEY } from "../config.js";
import { els, $$ } from "../core/dom.js";
import { emit, on } from "../core/events.js";
import { LS } from "../core/storage.js";
import { getDiagLog } from "../core/logger.js";
import { S, defaults, sanitize, replaceState, persist } from "../core/state.js";
import { cur } from "../reader/page-model.js";
import { goto } from "../reader/navigation.js";
import { showSheet } from "../reader/ayat-sheet.js";
import { applyPlaybackRate, hardStop, refreshPlayerUi } from "../audio/player.js";
import { toast } from "./toast.js";
import { applyTheme, applyWidth, syncWake } from "./theme.js";

/**
 * Menyamakan semua kontrol (pilihan, kotak centang, tema, lebar) dengan data `S`.
 * Dipanggil saat aplikasi mulai dan setiap data diganti (impor / sinkron / reset).
 */
export function syncControls() {
  const st = S.settings;
  els.selQari.value = st.reciter;
  els.selMode.value = st.audioMode;
  els.rngWrap.hidden = st.audioMode !== "range";
  els.selRepAyat.value = st.repeatAyah;
  els.selRepRange.value = st.repeatRange;
  els.selSpeed.value = st.speed;
  els.selGap.value = st.gap;
  els.setReveal.checked = st.autoReveal;
  els.setTrans.checked = st.showTranslation;
  els.setWake.checked = st.wake;
  applyTheme();
  applyWidth();
  applyPlaybackRate();
  refreshPlayerUi();
}

/** Menyalin info teknis ke clipboard untuk dilampirkan saat melapor masalah. */
async function copyDiagnostics() {
  const rows = $$(".baris", els.teks);
  const firstWord = els.teks.querySelector(".kata");
  let brave = false;
  try { brave = !!(navigator.brave && await navigator.brave.isBrave()); } catch { /* abaikan */ }

  const info = {
    app: `${APP.name} v${APP.version}`,
    ua: navigator.userAgent,
    brave,
    dpr: window.devicePixelRatio,
    viewport: `${innerWidth}x${innerHeight}`,
    page: cur.page,
    kolomW: els.teks.clientWidth,
    fs: els.teks.style.getPropertyValue("--fs"),
    pitch: els.teks.style.getPropertyValue("--pitch"),
    barisMeluber: rows.filter(r => r.scrollWidth > r.clientWidth + 1).length,
    fontKata: firstWord ? getComputedStyle(firstWord).fontFamily : null,
    lebarKataPertama: firstWord ? Math.round(firstWord.getBoundingClientRect().width * 100) / 100 : null,
    font: [...document.fonts].map(f => `${f.family}:${f.status}`),
    serviceWorker: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    catatan: getDiagLog()
  };
  const text = JSON.stringify(info, null, 2);

  try {
    await navigator.clipboard.writeText(text);
    toast("Info diagnostik disalin. Tempel ke pesan Anda.");
  } catch {
    window.prompt("Salin teks diagnostik ini:", text);   // cadangan bila clipboard diblokir
  }
}

/** Mengunduh seluruh data pengguna sebagai berkas JSON. */
function exportData() {
  const payload = { app: "mushaf-tahfidz-pro", version: 2, exportedAt: new Date().toISOString(), ...S };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mushaf-tahfidz-cadangan-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

/** Membaca berkas cadangan lalu mengganti data di perangkat ini. */
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(String(reader.result));
      const looksValid = obj && typeof obj === "object" &&
        (obj.page != null || obj.bookmarks != null || obj.memorized != null);
      if (!looksValid) throw new Error("bukan berkas cadangan");
      if (!confirm("Ganti data di perangkat ini dengan isi berkas cadangan?")) return;

      replaceState(sanitize(obj), { save: false });
      persist();
      emit("state:replaced");
      goto(S.page);
      toast("Cadangan berhasil diimpor");
    } catch {
      toast("Berkas cadangan tidak valid");
    }
  };
  reader.readAsText(file);
}

/** Menghapus semua data lokal (data di akun awan tidak ikut terhapus). */
function resetLocalData() {
  const message = "Hapus semua penanda, progres hafalan, dan pengaturan di perangkat ini? " +
                  "Data di akun awan (jika ada) tidak ikut terhapus.";
  if (!confirm(message)) return;

  hardStop(true);
  LS.del(STORAGE_KEY);
  LS.del(UID_KEY);
  const fresh = defaults();
  fresh.page = cur.page || 1;
  replaceState(fresh, { save: false });
  emit("state:replaced");
  els.dlgSet.close();
  toast("Data lokal dihapus");
}

export function initSettings() {
  on("state:replaced", syncControls);

  els.btnSettings.addEventListener("click", () => els.dlgSet.showModal());

  els.setReveal.addEventListener("change", () => { S.settings.autoReveal = els.setReveal.checked; persist(); });
  els.setTrans.addEventListener("change", () => {
    S.settings.showTranslation = els.setTrans.checked;
    persist();
    if (cur.sel && !els.ayatSheet.hidden) showSheet(cur.sel);   // segarkan kartu ayat yang sedang terbuka
  });
  els.setWake.addEventListener("change", () => { S.settings.wake = els.setWake.checked; persist(); syncWake(); });

  els.btnExport.addEventListener("click", exportData);
  els.btnImport.addEventListener("click", () => els.fileImport.click());
  els.fileImport.addEventListener("change", () => {
    if (els.fileImport.files[0]) importData(els.fileImport.files[0]);
    els.fileImport.value = "";
  });
  els.btnDiag.addEventListener("click", copyDiagnostics);
  els.btnReset.addEventListener("click", resetLocalData);
}
