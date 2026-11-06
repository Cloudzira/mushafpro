/**
 * reader/fit.js — Memaskan teks mushaf ke lebar halaman.
 *
 * Setiap baris mushaf Madinah harus memenuhi lebar halaman. Caranya:
 *  1. Ukur lebar alami semua baris pada ukuran font 100px (memakai <canvas>).
 *  2. Ambil baris terlebar → hitung ukuran font terbesar yang masih muat.
 *  3. Batasi juga oleh tinggi (15 baris harus muat dalam tinggi halaman).
 *  4. Simpan hasilnya di variabel CSS --fs (ukuran font) dan --pitch (tinggi baris).
 */
import { LAYOUT, PAGE_LINES } from "../config.js";
import { els, $$ } from "../core/dom.js";
import { PORTRAIT_PHONE } from "../core/media.js";
import { clamp } from "../core/utils.js";
import { cur } from "./page-model.js";

const measureCtx = document.createElement("canvas").getContext("2d");
let lastWidth = 0;

/** Lebar alami (px) satu baris bila memakai ukuran font `fontSize`. */
function naturalWidth(line, fontSize) {
  const words = line.querySelectorAll(".kata");
  let total = 0;
  words.forEach(word => {
    measureCtx.font = `${fontSize}px ${word.style.fontFamily || getComputedStyle(word).fontFamily}`;
    total += measureCtx.measureText(word.textContent).width;
  });
  const gapEm = line.classList.contains("basmalah")
    ? 0.3
    : (PORTRAIT_PHONE.matches ? LAYOUT.MOBILE_GAP_EM : LAYOUT.GAP_EM);
  return total + Math.max(0, words.length - 1) * gapEm * fontSize;
}

/** Mengubah variabel CSS hanya bila nilainya benar-benar berubah. */
function setCssVar(name, value) {
  if (els.teks.style.getPropertyValue(name) !== value) els.teks.style.setProperty(name, value);
}

/** Menghitung ulang ukuran font & tinggi baris untuk halaman saat ini. */
export function fit() {
  const width = els.teks.clientWidth;
  if (!width || !cur.page) return;

  const allLines = $$(".baris", els.teks);
  if (!allLines.length) return;

  // Semua baris dipaksa selebar kolom teks
  const widthPx = width + "px";
  allLines.forEach(line => { if (line.style.width !== widthPx) line.style.width = widthPx; });

  // Baris berisi teks (tanpa banner nama surat)
  const textLines = allLines.filter(line => !line.classList.contains("header"));
  if (!textLines.length) return;

  const BASE = 100;
  const widest = Math.max(...textLines.map(line => naturalWidth(line, BASE)));
  if (!widest) return;

  const maxByWidth = BASE * (width / widest) * LAYOUT.FIT_SLACK;
  const maxByHeight = els.teks.clientHeight / (PAGE_LINES * LAYOUT.PITCH);
  const fontSize = clamp(Math.min(maxByWidth, maxByHeight || maxByWidth), 4, 96);

  els.teks.style.setProperty("--fs", fontSize + "px");
  setCssVar("--pitch", String(LAYOUT.PITCH));

  // Baris yang lebih pendek dari 72% lebar → rata kanan (mis. akhir surat)
  textLines.forEach(line => {
    const isShort = !line.classList.contains("basmalah") && naturalWidth(line, fontSize) < width * LAYOUT.SHORT_LINE;
    line.classList.toggle("pendek", isShort);
  });
}

let raf = 0;
/** Menjadwalkan fit() pada frame berikutnya (aman dipanggil berkali-kali). */
export function fitSoon() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(fit);
}

/** Mencatat lebar kolom saat ini (dipanggil renderer setelah menggambar halaman). */
export function rememberWidth() {
  lastWidth = els.teks.clientWidth;
}

/** Menghitung ulang otomatis bila lebar kolom berubah (jendela diubah / lebar halaman di Pengaturan). */
export function initFitObserver() {
  new ResizeObserver(() => {
    const width = els.teks.clientWidth;
    if (cur.page && width && width !== lastWidth) { lastWidth = width; fitSoon(); }
  }).observe(els.teks);
}
