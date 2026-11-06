/**
 * reader/viewport.js — Menjaga ayat yang dipilih / diputar tetap terlihat di layar.
 *
 * "Area terlihat" = layar dikurangi pemutar audio & kartu ayat yang menempel di bawah.
 */
import { els, $ } from "../core/dom.js";
import { REDUCE_MOTION } from "../core/media.js";
import { cur } from "./page-model.js";

/** Memberi ruang kosong di bawah halaman supaya baris terakhir bisa digulir di atas kartu ayat. */
export function syncSheetSpace() {
  const px = els.ayatSheet.hidden ? 0 : els.ayatSheet.offsetHeight + 8;
  document.documentElement.style.setProperty("--sheet-extra", px + "px");
}

/** Batas bawah area yang benar-benar terlihat (di atas pemutar & kartu ayat). */
function visibleBottom() {
  let bottom = window.innerHeight;
  [$("player"), els.ayatSheet].forEach(el => {
    if (!el || el.hidden) return;
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) bottom = Math.min(bottom, rect.top);
  });
  return bottom;
}

/** Menggulir halaman bila ayat `key` tertutup atau berada di luar layar. */
export function keepInView(key) {
  const words = key ? cur.words.get(key) : null;
  if (!words || !words.length) return;
  syncSheetSpace();

  // Cari batas atas & bawah seluruh kata dalam ayat
  let top = Infinity, bottom = -Infinity;
  words.forEach(w => {
    const r = w.getBoundingClientRect();
    if (!r.height) return;
    if (r.top < top) top = r.top;
    if (r.bottom > bottom) bottom = r.bottom;
  });
  if (top === Infinity) return;

  const padding = 12;
  const viewTop = padding;
  const viewBottom = visibleBottom() - padding;
  const room = viewBottom - viewTop;
  if (room <= 40) return;
  if (top >= viewTop && bottom <= viewBottom) return;   // sudah terlihat penuh

  const verseHeight = bottom - top;
  const delta = verseHeight >= room
    ? top - viewTop                                     // ayat panjang: tampilkan awal ayat di atas
    : (top + bottom) / 2 - (viewTop + room / 2);        // ayat pendek: taruh di tengah area terlihat
  if (Math.abs(delta) < 2) return;

  window.scrollBy({ top: delta, left: 0, behavior: REDUCE_MOTION.matches ? "auto" : "smooth" });
}

let frame = 0;
/** Seperti keepInView, tetapi menunggu tata letak & kartu ayat selesai digambar dulu. */
export function keepInViewSoon(key) {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => keepInView(key)); });
}
