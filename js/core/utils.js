/**
 * core/utils.js — Fungsi bantu kecil yang dipakai di banyak tempat.
 * Tidak ada yang berhubungan dengan tampilan; semuanya fungsi murni.
 */
import { surahName } from "../data/surah.js";
import { JUZ_START } from "../data/juz.js";
import { PAGES } from "../config.js";

/* ---------- Angka ---------- */

/** Membatasi angka `n` agar berada di antara `min` dan `max`. */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/** 7 → "007" (format nama berkas audio). */
export const pad3 = n => String(n).padStart(3, "0");

/** 12 → "١٢" (angka Arab-Indic). */
export const toAr = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);

/* ---------- Kunci ayat ("verse key") ----------
   Setiap ayat dikenali dengan teks "surat:ayat", misalnya "2:255". */

/** "2:255" → [2, 255] */
export const parseKey = key => key.split(":").map(Number);

/** Angka urut ayat agar bisa dibandingkan: "2:255" → 2255. */
export const ord = key => { const [s, a] = parseKey(key); return s * 1000 + a; };

/** Membuat daftar kunci ayat: keysRange(2, 1, 3) → ["2:1", "2:2", "2:3"]. */
export function keysRange(surah, from, to) {
  const out = [];
  for (let i = from; i <= to; i++) out.push(surah + ":" + i);
  return out;
}

/** "2:255" → "QS Al-Baqarah : 255" */
export function labelKey(key) {
  const [s, a] = parseKey(key);
  return `QS ${surahName(s)} : ${a}`;
}

/* ---------- Juz & halaman ---------- */

/** Nomor juz dari nomor halaman. */
export function juzOf(page) {
  let juz = 1;
  for (let i = 0; i < 30; i++) if (JUZ_START[i] <= page) juz = i + 1;
  return juz;
}

/** [halaman pertama, halaman terakhir] untuk suatu juz. */
export const juzRange = j => [JUZ_START[j - 1], (JUZ_START[j] || PAGES + 1) - 1];

/* ---------- Teks ---------- */

/** Menyederhanakan teks untuk pencarian: huruf kecil, hanya a-z, 0-9, dan huruf Arab. */
export const normalize = s => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");

/* ---------- Waktu & performa ---------- */

/** Menunggu `ms` milidetik:  await sleep(500) */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Menjalankan `cb` saat browser sedang senggang. */
export const idle = cb =>
  ("requestIdleCallback" in window) ? requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 400);

/** Menunda `fn` sampai tidak dipanggil lagi selama `ms` milidetik. */
export const debounce = (fn, ms) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
};

/* ---------- Jaringan ---------- */

/** Mengambil JSON dari `url`; mencoba ulang hingga `tries` kali bila gagal. */
export async function fetchJson(url, tries = 2) {
  let lastError;
  for (let i = 0; i <= tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (i < tries) await sleep(350 * (i + 1));
    }
  }
  throw lastError;
}
