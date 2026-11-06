/**
 * core/state.js — Data milik pengguna (halaman terakhir, penanda, hafalan, pengaturan).
 *
 * Bentuk data (variabel `S`):
 * {
 *   page: 1,                        // halaman terakhir dibaca
 *   bookmarks: [{ page, surah, juz, ts }],
 *   memorized: { "12": 1700000000 },// halaman yang sudah dihafal → waktu penandaan
 *   settings: { theme, width, hideMode, reciter, speed, ... },
 *   updatedAt: 0                    // dipakai untuk menentukan data terbaru saat sinkronisasi
 * }
 *
 * PENTING: `S` adalah "live binding". Modul lain cukup `import { S }` lalu membacanya;
 * bila data diganti lewat replaceState(), semua modul otomatis melihat nilai terbaru.
 */
import { PAGES, OPTIONS, STORAGE_KEY } from "../config.js";
import { QARI } from "../data/reciters.js";
import { LS } from "./storage.js";
import { juzOf } from "./utils.js";
import { emit } from "./events.js";

/** Data awal untuk pengguna baru. */
export function defaults() {
  return {
    page: 1,
    bookmarks: [],
    memorized: {},
    settings: {
      theme: "dark", width: 700, hideMode: "normal", reciter: QARI[0].id,
      speed: 1, repeatAyah: 1, repeatRange: 1, gap: 0, audioMode: "page",
      autoReveal: true, showTranslation: true, wake: false
    },
    updatedAt: 0
  };
}

/** Hanya meloloskan pengaturan yang nilainya sah (aman terhadap data rusak/diubah manual). */
function pickValidSettings(raw) {
  const out = {};
  for (const key in OPTIONS) if (OPTIONS[key].includes(raw[key])) out[key] = raw[key];
  if (QARI.some(q => q.id === raw.reciter)) out.reciter = raw.reciter;
  const width = Number(raw.width);
  if (width >= 480 && width <= 960) out.width = Math.round(width);
  for (const key of ["autoReveal", "showTranslation", "wake"]) {
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  }
  return out;
}

/**
 * Membersihkan data apa pun (dari localStorage, berkas cadangan, atau awan)
 * menjadi bentuk data yang pasti valid. Data yang tidak valid dibuang.
 */
export function sanitize(raw) {
  const result = defaults();
  if (!raw || typeof raw !== "object") return result;

  // halaman terakhir (mendukung nama lama "halaman_terakhir")
  const page = Math.round(Number(raw.page != null ? raw.page : raw.halaman_terakhir));
  if (page >= 1 && page <= PAGES) result.page = page;

  // penanda: satu per halaman, ambil yang terbaru
  if (Array.isArray(raw.bookmarks)) {
    const byPage = new Map();
    raw.bookmarks.forEach(item => {
      const p = Math.round(Number(item && item.page));
      if (!(p >= 1 && p <= PAGES)) return;
      const ts = Number(item.ts) || 0;
      const existing = byPage.get(p);
      if (!existing || ts > existing.ts) {
        byPage.set(p, { page: p, surah: String(item.surah || "").slice(0, 80), juz: juzOf(p), ts });
      }
    });
    result.bookmarks = [...byPage.values()];
  }

  // halaman yang sudah dihafal
  if (raw.memorized && typeof raw.memorized === "object") {
    for (const [key, value] of Object.entries(raw.memorized)) {
      const p = Number(key);
      if (p >= 1 && p <= PAGES) result.memorized[p] = Number(value) || 1;
    }
  }

  if (raw.settings && typeof raw.settings === "object") {
    Object.assign(result.settings, pickValidSettings(raw.settings));
  }
  result.updatedAt = Number(raw.updatedAt) || Date.parse(raw.updated_at) || 0;
  return result;
}

/** Memuat data dari localStorage (dan memigrasikan data versi lama bila ada). */
function loadState() {
  const saved = LS.get(STORAGE_KEY, null);
  if (saved && typeof saved === "object") return sanitize(saved);

  // Migrasi dari versi lama aplikasi (kunci "quran_*")
  const migrated = defaults();
  const oldPage = Number(LS.raw("quran_halaman"));
  if (oldPage >= 1 && oldPage <= PAGES) migrated.page = oldPage;
  try {
    const oldBookmarks = JSON.parse(LS.raw("quran_bookmarks") || "[]");
    if (Array.isArray(oldBookmarks)) {
      migrated.bookmarks = sanitize({
        bookmarks: oldBookmarks.map(b => ({ page: b && b.halaman, surah: b && b.surah, ts: 1 }))
      }).bookmarks;
    }
  } catch { /* abaikan */ }
  const oldTheme = LS.raw("quran_tema");
  if (oldTheme === "light" || oldTheme === "dark") migrated.settings.theme = oldTheme;
  return migrated;
}

/** Data pengguna saat ini. Jangan diganti langsung; gunakan replaceState(). */
export let S = loadState();

/** Mengganti seluruh data (impor cadangan, sinkron awan, hapus data). */
export function replaceState(next, { save = true } = {}) {
  S = next;
  if (save) LS.set(STORAGE_KEY, S);
}

/**
 * Menyimpan data ke perangkat. Panggil setiap kali `S` diubah.
 * Mengumumkan event "state:saved" agar sinkronisasi awan bisa menyusul.
 */
export function persist() {
  S.updatedAt = Date.now();
  LS.set(STORAGE_KEY, S);
  emit("state:saved");
}
