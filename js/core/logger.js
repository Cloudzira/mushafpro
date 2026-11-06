/**
 * core/logger.js — Catatan galat ringkas.
 *
 * Isinya ditampilkan oleh tombol "Salin info diagnostik" di Pengaturan,
 * sehingga pengguna bisa mengirim keterangan masalah ke pengembang.
 */
const MAX_ENTRIES = 25;
const buffer = [];

/** Menambah satu catatan (jenis + pesan). Hanya {MAX_ENTRIES} catatan terakhir disimpan. */
export function logDiag(kind, message) {
  const time = new Date().toISOString().slice(11, 19);
  buffer.push(`${time} ${kind}: ${String(message).slice(0, 220)}`);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

/** Mengambil salinan catatan untuk laporan diagnostik. */
export const getDiagLog = () => [...buffer];

/** Menangkap galat global & console.warn secara otomatis. Panggil sekali saat aplikasi mulai. */
export function installErrorLogging() {
  window.addEventListener("error", e => {
    const file = String(e.filename || "").split("/").pop();
    logDiag("error", `${e.message} @${file}:${e.lineno}`);
  });
  window.addEventListener("unhandledrejection", e => {
    logDiag("promise", e.reason && (e.reason.message || e.reason));
  });
  const originalWarn = console.warn;
  console.warn = (...args) => {
    logDiag("warn", args.map(String).join(" "));
    originalWarn.apply(console, args);
  };
}
