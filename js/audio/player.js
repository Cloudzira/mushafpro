/**
 * audio/player.js — Mesin pemutar audio dan kontrol pemutar di bagian bawah layar.
 *
 * Konsep penting:
 *  • queue (antrean)  : daftar ayat yang akan diputar, mis. ["2:1", "2:2", ...]
 *  • P                : keadaan pemutaran (lihat objek P di bawah)
 *  • token (P.tk)     : nomor "sesi" pemutaran. Setiap kali pemutaran dimulai/dibatalkan,
 *                       nomor naik; proses lama yang ketahuan nomornya usang langsung berhenti.
 *  • gap (jeda)       : jeda antar ayat. -1 = "giliran Anda" (jeda sepanjang ayat itu).
 *  • repeatAyah       : ulang tiap ayat; repeatRange: ulang seluruh antrean (0 = tanpa batas)
 */
import { PAGES, PLAY_TIMEOUT } from "../config.js";
import { QARI } from "../data/reciters.js";
import { surahName, surahVerseCount } from "../data/surah.js";
import { els } from "../core/dom.js";
import { on } from "../core/events.js";
import { S, persist } from "../core/state.js";
import { clamp, keysRange, labelKey, ord, parseKey } from "../core/utils.js";
import { toast } from "../ui/toast.js";
import { cur } from "../reader/page-model.js";
import { goto, versePage } from "../reader/navigation.js";
import { getPlayingKey, markPlaying, revealVerse } from "../reader/selection.js";
import { keepInView } from "../reader/viewport.js";
import { allSources, hostOf, isBadHost, markBadHost } from "./sources.js";

/* ---------------------------------------------------------------
   Keadaan pemutaran
   --------------------------------------------------------------- */
const audio = new Audio();          // elemen audio utama
audio.preload = "auto";
const preloader = new Audio();      // elemen cadangan untuk memuat ayat berikutnya lebih awal
preloader.preload = "auto";
preloader.muted = true;

const P = {
  queue: [],        // antrean ayat
  i: 0,             // posisi ayat dalam antrean
  ra: 0,            // sudah berapa kali ayat ini diulang
  rr: 0,            // sudah berapa putaran seluruh antrean
  tk: 0,            // token sesi
  active: false,    // ada sesi pemutaran?
  paused: false,    // sedang dijeda saat masa "jeda antar ayat"?
  inGap: false,     // sedang di masa jeda antar ayat?
  startPage: 1,     // halaman saat pemutaran dimulai
  ov: {},           // pengaturan khusus sesi ini (menimpa pengaturan umum)
  gapTimer: null,
  resume: null,     // fungsi untuk melanjutkan setelah jeda
  si: 0             // indeks server audio yang berhasil dipakai
};

let loadingSource = false;     // true selama mencari server audio yang bisa diputar
let notedFallback = false;     // pemberitahuan "diganti Alafasy" cukup sekali per sesi

/** Nilai pengaturan efektif: pengaturan sesi (P.ov) lebih diutamakan daripada pengaturan umum. */
const effective = name => (P.ov[name] !== undefined ? P.ov[name] : S.settings[name]);

export const isAudioActive = () => P.active;

/** Nama qari yang sedang dipilih. */
export function qariName() {
  return (QARI.find(q => q.id === S.settings.reciter) || QARI[0]).nama;
}

/* ---------------------------------------------------------------
   Membuka kunci audio (iOS / Safari)
   iOS hanya mengizinkan audio bila play() dipicu langsung oleh sentuhan pengguna.
   Elemen audio "dibuka kuncinya" sekali dengan WAV senyap, lalu dipakai ulang.
   --------------------------------------------------------------- */
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
let unlocked = false;

function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  audio.src = SILENT_WAV;
  audio.play().catch(() => {});
}
const isSilent = () => audio.src.startsWith("data:");

/* ---------------------------------------------------------------
   Memutar satu ayat: mencoba tiap server sampai ada yang berhasil
   --------------------------------------------------------------- */

/** audio.play() dengan batas waktu supaya server yang macet tidak menahan selamanya. */
function playWithTimeout(ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    audio.play().then(
      () => { clearTimeout(timer); resolve(); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Mencoba semua sumber audio untuk ayat `key` secara berurutan.
 * @returns {Promise<true|false|null>} true = berhasil, false = gagal/dibatalkan,
 *          null = browser menahan suara (pengguna sudah diberi tahu).
 */
async function playSources(session, key) {
  const { list, own } = allSources(key);
  const failedHosts = new Set();
  const rate = Number(S.settings.speed) || 1;
  const canSkipBad = list.some(url => !isBadHost(hostOf(url)));   // lewati server macet selama masih ada yang lain

  for (let i = 0; i < list.length; i++) {
    if (session !== P.tk || !P.active) return false;
    const host = hostOf(list[i]);
    if (canSkipBad && isBadHost(host)) continue;
    if (i >= own && failedHosts.has(host)) continue;   // pada suara pengganti, lewati server yang baru gagal

    audio.defaultPlaybackRate = rate;
    audio.src = list[i];
    audio.playbackRate = rate;
    audio.preservesPitch = true;

    try {
      await playWithTimeout(PLAY_TIMEOUT);
      if (session !== P.tk) return false;
      P.si = i;
      if (i >= own && !notedFallback) {
        notedFallback = true;
        toast("Server qari ini sedang gagal, memutar suara Alafasy sebagai pengganti.");
      }
      return true;
    } catch (err) {
      if (session !== P.tk) return false;
      if (err && err.name === "AbortError") return false;          // dijeda/dibatalkan pengguna
      if (err && err.name === "NotAllowedError") {
        toast("Browser menahan suara. Ketuk tombol putar sekali lagi.");
        return null;
      }
      console.warn("Audio gagal:", list[i], err);
      failedHosts.add(host);
      if (err && err.message === "timeout") markBadHost(host);
    }
  }
  return false;
}

/* ---------------------------------------------------------------
   Antrean & siklus pemutaran
   --------------------------------------------------------------- */

/** Menyusun antrean ayat sesuai "Cakupan putar" yang dipilih di panel audio. */
function buildQueue() {
  const mode = S.settings.audioMode;
  const verses = cur.verses;
  if (!verses.length) return [];

  if (mode === "page") return verses.slice();                 // seluruh halaman
  if (mode === "ayah") return [cur.sel || verses[0]];         // satu ayat terpilih

  if (mode === "range") {                                     // rentang ayat dari panel
    const surahId = Number(els.rngSurah.value) || cur.surahs[0].id;
    const total = surahVerseCount(surahId);
    let from = clamp(parseInt(els.rngFrom.value, 10) || 1, 1, total);
    let to = clamp(parseInt(els.rngTo.value, 10) || from, 1, total);
    if (to < from) [from, to] = [to, from];
    return keysRange(surahId, from, to);
  }

  // "surah": dari ayat terpilih sampai akhir surat
  const [surahId, ayah] = parseKey(cur.sel || verses[0]);
  return keysRange(surahId, ayah, surahVerseCount(surahId));
}

function clearGap() {
  clearTimeout(P.gapTimer);
  P.gapTimer = null;
  P.resume = null;
  P.inGap = false;
  P.paused = false;
}

/** Menghentikan semuanya & mengosongkan antrean. */
export function hardStop(resetUi) {
  P.tk++;
  P.active = false;
  P.queue = [];
  P.i = 0; P.ra = 0; P.rr = 0;
  P.ov = {};
  clearGap();
  try { audio.pause(); } catch { /* abaikan */ }
  markPlaying(null);
  els.plBar.style.width = "0%";
  if (resetUi) refreshPlayerUi();
}

/**
 * Memulai pemutaran antrean ayat.
 * @param {string[]} queue daftar verse_key
 * @param {object}   ov    pengaturan khusus sesi ini, mis. { repeatAyah: 5, gap: -1 }
 */
export async function startPlayback(queue, ov = {}) {
  if (!queue.length) { toast("Tidak ada ayat untuk diputar."); return; }
  unlockAudio();
  hardStop(false);
  P.queue = queue;
  P.ov = ov;
  P.active = true;
  P.startPage = cur.page;
  P.si = 0;
  notedFallback = false;
  const session = ++P.tk;
  setMediaSessionHandlers();
  await playCurrent(session);
}

/** Memutar ayat pada posisi P.i. */
async function playCurrent(session) {
  if (session !== P.tk || !P.active) return;
  const key = P.queue[P.i];

  await ensureVisible(key, session);
  if (session !== P.tk || !P.active) return;

  markPlaying(key);
  if (S.settings.autoReveal) revealVerse(key);
  clearGap();

  loadingSource = true;
  let result = false;
  try { result = await playSources(session, key); } finally { loadingSource = false; }

  if (result === null) { if (session === P.tk) hardStop(true); return; }
  if (!result) {
    if (session === P.tk && P.active) {
      toast(navigator.onLine === false
        ? "Tidak ada koneksi internet."
        : "Audio gagal dimuat dari semua server. Coba lagi atau ganti qari.");
      hardStop(true);
    }
    return;
  }
  refreshPlayerUi();
  updateMediaMetadata(key);
  prefetchNext();
}

/**
 * Apakah layar masih "mengikuti" audio? Ya bila belum ada ayat yang diputar, atau ayat
 * yang diputar masih ada di halaman yang dibuka. Bila pengguna sudah pindah halaman,
 * audio tetap jalan tetapi layar tidak ditarik kembali.
 */
const isFollowing = () => !getPlayingKey() || cur.verseSet.has(getPlayingKey());

/** Membuka halaman yang memuat ayat `key` agar ayat yang diputar terlihat. */
async function ensureVisible(key, session) {
  if (cur.verseSet.has(key)) return;
  if (!isFollowing()) return;

  let page = null;
  try { page = await versePage(key); } catch { /* lanjut ke cara manual */ }
  if (session !== P.tk) return;

  if (page && page !== cur.page) { await goto(page, { auto: true }); return; }

  if (!page) {
    // Cara manual: maju/mundur satu halaman sampai ayatnya ketemu (maksimal 6 kali)
    for (let attempt = 0; attempt < 6 && !cur.verseSet.has(key); attempt++) {
      const lastOnPage = cur.verses.length ? ord(cur.verses[cur.verses.length - 1]) : 0;
      const target = ord(key) > lastOnPage ? cur.page + 1 : cur.page - 1;
      if (target < 1 || target > PAGES) break;
      await goto(target, { auto: true });
      if (session !== P.tk) return;
    }
  }
}

/** Memuat ayat berikutnya lebih awal supaya perpindahan antar ayat mulus. */
function prefetchNext() {
  const repeat = Number(effective("repeatAyah"));
  if (repeat === 0 || P.ra + 1 < repeat) return;     // masih akan mengulang ayat yang sama
  const next = P.queue[P.i + 1];
  if (!next) return;
  const { list } = allSources(next);
  preloader.src = list[Math.min(P.si || 0, list.length - 1)];
  try { preloader.load(); } catch { /* abaikan */ }
}

/** Ayat selesai diputar → ulangi, atau lanjut ke ayat berikut, atau selesai. */
function handleEnded() {
  if (!P.active || isSilent()) return;
  const session = P.tk;
  P.ra++;
  const repeatAyah = Number(effective("repeatAyah"));

  const advance = async () => {
    if (session !== P.tk || !P.active) return;
    P.resume = null;
    P.inGap = false;

    if (repeatAyah === 0 || P.ra < repeatAyah) return playCurrent(session);   // ulangi ayat ini

    P.ra = 0;
    P.i++;
    if (P.i >= P.queue.length) {                       // antrean habis
      P.rr++;
      const repeatRange = Number(effective("repeatRange"));
      if (repeatRange === 0 || P.rr < repeatRange) {   // ulangi dari awal
        P.i = 0;
        if (cur.page !== P.startPage && isFollowing()) await goto(P.startPage, { auto: true });
      } else {
        finish();
        return;
      }
    }
    return playCurrent(session);
  };

  // Hitung jeda antar ayat
  const gap = Number(effective("gap"));
  const rate = Number(audio.playbackRate) || 1;
  const gapMs = gap < 0
    ? Math.round(((audio.duration || 2) / rate) * 1000)   // "giliran Anda": sepanjang ayat
    : gap * 1000;

  if (gapMs > 0) {
    P.inGap = true;
    P.resume = advance;
    refreshPlayerUi();
    P.gapTimer = setTimeout(() => { P.gapTimer = null; advance(); }, gapMs);
  } else {
    advance();
  }
}

function finish() {
  hardStop(true);
  toast("Pemutaran selesai");
}

/** Lompat `delta` ayat (−1 sebelumnya, +1 berikutnya, 0 = ulang ayat ini). */
export function skip(delta) {
  if (!P.active) return;
  const next = P.i + delta;
  if (next < 0 || next >= P.queue.length) return;
  clearGap();
  P.i = next;
  P.ra = 0;
  playCurrent(++P.tk);
}

/** Tombol putar/jeda. */
export function togglePlay() {
  if (!P.active) { startPlayback(buildQueue()); return; }
  unlockAudio();

  if (P.inGap) {                         // sedang di masa jeda antar ayat
    if (P.gapTimer) { clearTimeout(P.gapTimer); P.gapTimer = null; P.paused = true; }
    else if (P.paused && P.resume) { const resume = P.resume; P.paused = false; resume(); }
    refreshPlayerUi();
    return;
  }
  if (audio.paused) audio.play().catch(() => {}); else audio.pause();
}

/* ---------------------------------------------------------------
   Tampilan pemutar
   --------------------------------------------------------------- */

/** Memperbarui ikon putar/jeda serta judul & keterangan di pemutar. */
export function refreshPlayerUi() {
  const playing = P.active && (P.inGap ? !P.paused : !audio.paused);
  els.plPlayIcon.setAttribute("href", playing ? "#i-pause" : "#i-play");
  els.plPlay.setAttribute("aria-label", playing ? "Jeda" : "Putar");

  if (P.active && P.queue.length) {
    els.plTitle.textContent = labelKey(P.queue[P.i]);
    const repeatAyah = Number(effective("repeatAyah"));
    const repeatRange = Number(effective("repeatRange"));
    let sub = P.inGap ? "Giliran Anda: lantunkan ayat ini…" : `Ayat ${P.i + 1} dari ${P.queue.length}`;
    if (repeatAyah !== 1) sub += ` · ulang ${P.ra + 1}/${repeatAyah === 0 ? "∞" : repeatAyah}`;
    if (repeatRange !== 1) sub += ` · putaran ${P.rr + 1}/${repeatRange === 0 ? "∞" : repeatRange}`;
    els.plSub.textContent = sub;
  } else {
    els.plTitle.textContent = "Murattal · " + qariName();
    els.plSub.textContent = "Siap diputar";
  }
}

/** Menerapkan kecepatan putar dari pengaturan ke elemen audio. */
export function applyPlaybackRate() {
  audio.defaultPlaybackRate = S.settings.speed;
  audio.playbackRate = S.settings.speed;
}

/* ---------------------------------------------------------------
   Media Session: tombol audio di layar kunci / notifikasi ponsel
   --------------------------------------------------------------- */
function updateMediaMetadata(key) {
  if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: labelKey(key),
      artist: qariName(),
      album: "Mushaf Tahfidz Pro",
      artwork: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }]
    });
  } catch { /* abaikan */ }
}

function setMediaSessionHandlers() {
  if (!("mediaSession" in navigator)) return;
  const set = (action, handler) => {
    try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* tidak didukung */ }
  };
  set("play", togglePlay);
  set("pause", togglePlay);
  set("previoustrack", () => skip(-1));
  set("nexttrack", () => skip(1));
  set("stop", () => hardStop(true));
}

/* ---------------------------------------------------------------
   Panel opsi audio (qari, cakupan, ulangan, kecepatan, jeda)
   --------------------------------------------------------------- */

/** Mengisi pilihan surat pada "Rentang ayat" sesuai surat di halaman ini. */
function fillRangeControls() {
  const previous = els.rngSurah.value;
  els.rngSurah.replaceChildren();
  cur.surahs.forEach(s => els.rngSurah.append(new Option(`${s.id}. ${surahName(s.id)}`, s.id)));
  if (previous && cur.surahs.some(s => String(s.id) === previous)) els.rngSurah.value = previous;
  syncRangeDefaults();
}

/** Mengisi nilai awal "Dari ayat" / "Sampai" sesuai cakupan surat di halaman ini. */
function syncRangeDefaults() {
  const id = Number(els.rngSurah.value) || (cur.surahs[0] && cur.surahs[0].id) || 1;
  const info = cur.surahs.find(s => s.id === id);
  const total = surahVerseCount(id);
  els.rngFrom.max = total;
  els.rngTo.max = total;
  els.rngFrom.value = info ? info.from : 1;
  els.rngTo.value = info ? info.to : total;
}

function bindPanelSettings() {
  QARI.forEach(q => els.selQari.append(new Option(q.nama, q.id)));

  // Pilihan angka sederhana: simpan nilai ke pengaturan lalu segarkan keterangan pemutar
  const bindNumber = (select, settingName) => select.addEventListener("change", () => {
    S.settings[settingName] = Number(select.value);
    persist();
    refreshPlayerUi();
  });
  bindNumber(els.selRepAyat, "repeatAyah");
  bindNumber(els.selRepRange, "repeatRange");
  bindNumber(els.selGap, "gap");

  els.selQari.addEventListener("change", () => {
    S.settings.reciter = els.selQari.value;
    persist();
    refreshPlayerUi();
    if (P.active) skip(0);            // putar ulang ayat ini dengan qari baru
  });

  els.selMode.addEventListener("change", () => {
    S.settings.audioMode = els.selMode.value;
    persist();
    els.rngWrap.hidden = S.settings.audioMode !== "range";
  });

  els.selSpeed.addEventListener("change", () => {
    S.settings.speed = Number(els.selSpeed.value);
    persist();
    applyPlaybackRate();
  });

  els.rngSurah.addEventListener("change", syncRangeDefaults);
}

/* ---------------------------------------------------------------
   Inisialisasi
   --------------------------------------------------------------- */
export function initPlayer() {
  // Kontrol utama
  els.plPlay.addEventListener("click", togglePlay);
  els.plStop.addEventListener("click", () => hardStop(true));
  els.plPrev.addEventListener("click", () => skip(-1));
  els.plNext.addEventListener("click", () => skip(1));
  els.plMore.addEventListener("click", () => {
    const willOpen = els.plPanel.hidden;
    els.plPanel.hidden = !willOpen;
    els.plMore.setAttribute("aria-expanded", String(willOpen));
  });

  bindPanelSettings();

  // Peristiwa elemen audio
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("play", refreshPlayerUi);
  audio.addEventListener("pause", refreshPlayerUi);
  audio.addEventListener("timeupdate", () => {
    if (audio.duration > 0) els.plBar.style.width = (audio.currentTime / audio.duration * 100) + "%";
  });
  audio.addEventListener("error", () => {
    if (loadingSource || !P.active || isSilent()) return;
    toast("Audio gagal dimuat. Periksa koneksi internet atau ganti qari.");
    hardStop(true);
  });

  // Halaman baru digambar → perbarui daftar surat pada "Rentang ayat"
  on("page:rendered", fillRangeControls);

  // Layar diputar / diubah ukurannya → tampilkan lagi ayat yang sedang diputar atau dipilih
  let timer;
  const refollow = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const key = (P.active && getPlayingKey()) || cur.sel;
      if (key) keepInView(key);
    }, 350);
  };
  window.addEventListener("resize", refollow);
  window.addEventListener("orientationchange", refollow);
}
