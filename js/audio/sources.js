/**
 * audio/sources.js — Alamat berkas audio untuk setiap ayat, lengkap dengan server cadangan.
 *
 * Urutan percobaan untuk satu ayat:
 *   1. everyayah.com (qari pilihan)
 *   2. server cadangan qari yang sama (bila ada)
 *   3. bila semuanya gagal → suara Alafasy (qari pengganti) di server-servernya
 */
import { AUDIO_URL, QC_CDN, ISL_CDN, FALLBACK_QARI, BAD_HOST_TTL } from "../config.js";
import { MIRRORS } from "../data/reciters.js";
import { globalAyah } from "../data/surah.js";
import { S } from "../core/state.js";
import { pad3, parseKey } from "../core/utils.js";

/* ---------- Server yang sedang macet ----------
   Server yang timeout diingat beberapa menit supaya ayat berikutnya tidak menunggu lagi. */
const badHosts = {};

export const hostOf = url => { try { return new URL(url).hostname; } catch { return ""; } };
export const isBadHost = host => !!badHosts[host] && (Date.now() - badHosts[host]) < BAD_HOST_TTL;
export const markBadHost = host => { badHosts[host] = Date.now(); };

/** Daftar alamat audio satu ayat untuk satu qari. */
function sourcesFor(key, reciter) {
  const [surahId, ayah] = parseKey(key);
  const file = pad3(surahId) + pad3(ayah) + ".mp3";
  const mirror = MIRRORS[reciter] || {};
  const urls = [`${AUDIO_URL}${reciter}/${file}`];
  if (mirror.qc)  urls.push(`${QC_CDN}${mirror.qc}/${file}`);
  if (mirror.isl) urls.push(`${ISL_CDN}${mirror.isl}/${globalAyah(surahId, ayah)}.mp3`);
  return urls;
}

/**
 * Semua alamat yang boleh dicoba untuk ayat `key`.
 * @returns {{ list: string[], own: number }}
 *   list = seluruh alamat berurutan; own = jumlah alamat milik qari terpilih
 *   (alamat setelahnya adalah suara pengganti).
 */
export function allSources(key) {
  const reciter = S.settings.reciter;
  const own = sourcesFor(key, reciter);
  if (reciter === FALLBACK_QARI) return { list: own, own: own.length };
  return { list: own.concat(sourcesFor(key, FALLBACK_QARI)), own: own.length };
}
