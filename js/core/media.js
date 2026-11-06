/**
 * core/media.js — Pertanyaan tentang perangkat & preferensi pengguna (media query).
 */

/** Ponsel dalam posisi potret → tata letak mushaf dibuat lebih rapat. */
export const PORTRAIT_PHONE = window.matchMedia("(max-width: 640px) and (orientation: portrait)");

/** Pengguna meminta animasi dikurangi. */
export const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Sistem operasi memakai mode gelap. */
export const PREFERS_DARK = window.matchMedia("(prefers-color-scheme: dark)");

/** Apakah aplikasi sedang berjalan sebagai aplikasi terpasang (bukan di tab browser)? */
export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}
