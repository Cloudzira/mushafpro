/**
 * core/storage.js — Pembungkus localStorage yang aman.
 *
 * localStorage bisa gagal (penyimpanan penuh, mode privat, diblokir browser).
 * Semua fungsi di sini menelan galat tersebut agar aplikasi tidak ikut rusak.
 */
export const LS = {
  /** Membaca & mengurai JSON. Mengembalikan `fallback` bila kosong atau gagal. */
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  },

  /** Menyimpan nilai sebagai JSON. */
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* penyimpanan penuh atau diblokir — abaikan */ }
  },

  /** Membaca teks mentah (tanpa JSON.parse). */
  raw(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },

  /** Menghapus satu kunci. */
  del(key) {
    try { localStorage.removeItem(key); } catch { /* abaikan */ }
  }
};
