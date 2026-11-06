/**
 * reader/renderer.js — Menggambar satu halaman mushaf ke layar.
 *
 * Alur render(no):
 *   1. Unduh data halaman + font-nya.
 *   2. Bangun elemen: tiap baris → <div class="baris">, tiap kata → <span class="kata">.
 *   3. Isi objek `cur` (lihat page-model.js).
 *   4. Pas-kan ke lebar halaman (fit) lalu umumkan event "page:rendered".
 */
import { SURAH, surahVerseCount, surahArabic } from "../data/surah.js";
import { els, h, icon } from "../core/dom.js";
import { emit } from "../core/events.js";
import { parseKey } from "../core/utils.js";
import { loadPage, loadFont, fontsOf } from "../services/quran-api.js";
import { cur } from "./page-model.js";
import { fit, rememberWidth } from "./fit.js";

/**
 * @param {number}   no       nomor halaman
 * @param {Function} isStale  mengembalikan true bila ada permintaan halaman yang lebih baru
 * @param {Function} onRetry  dipanggil bila pengguna menekan "Coba lagi"
 * @returns {Promise<boolean>} true bila halaman berhasil digambar
 */
export async function render(no, isStale, onRetry) {
  els.teks.classList.add("memuat");
  els.teks.setAttribute("aria-busy", "true");

  // 1) Unduh data & font
  let data;
  try {
    data = await loadPage(no);
    await Promise.all(fontsOf(data).map(loadFont));
  } catch (err) {
    console.warn("Gagal memuat halaman", no, err);
    if (!isStale()) showError(no, onRetry);
    return false;
  }
  if (isStale()) return false;   // pengguna sudah pindah ke halaman lain

  // 2) Bangun elemen halaman
  const fragment = document.createDocumentFragment();
  const words = new Map();       // verse_key → elemen-elemen kata
  const verses = [];             // urutan verse_key
  const seenFirst = new Set();   // ayat yang kata pertamanya sudah ditandai

  data.lines.forEach(line => {
    const row = h("div", "baris");
    const header = line.words.find(w => w.type === "surah_header");

    if (header) {
      // Baris judul surat (banner)
      row.classList.add("header");
      const banner = h("div", "banner");
      const surahId = header.sura || (data.surahs && data.surahs[0] && data.surahs[0].id);
      const title = surahId && SURAH[surahId - 1] ? "سورة " + surahArabic(surahId) : header.text;
      banner.appendChild(h("span", null, title));
      row.appendChild(banner);
    } else {
      if (line.words.length && line.words.every(w => w.type === "bismillah")) row.classList.add("basmalah");

      line.words.forEach(word => {
        const el = h("span", "kata", word.char);
        el.style.fontFamily = `"${word.font}"`;
        const key = word.verse_key;

        if (key) {
          el.dataset.v = key;
          if (!words.has(key)) { words.set(key, []); verses.push(key); }
          words.get(key).push(el);
        }

        if (word.type === "end") {
          // Tanda akhir ayat → tombol yang bisa diketuk
          el.classList.add("is-end");
          el.setAttribute("role", "button");
          el.tabIndex = 0;
          el.setAttribute("aria-label", "Ayat " + (key ? parseKey(key)[1] : ""));
        } else if (key && word.type !== "quarter" && !seenFirst.has(key)) {
          // Kata pertama ayat (dipakai mode "Kata awal")
          seenFirst.add(key);
          el.classList.add("is-first");
        }
        row.appendChild(el);
      });
    }
    fragment.appendChild(row);
  });

  els.teks.replaceChildren(fragment);
  els.teks.classList.remove("memuat");
  els.teks.removeAttribute("aria-busy");
  els.teks.classList.toggle("rata-tengah", no <= 2);   // halaman 1–2 rata tengah

  // 3) Simpan keadaan halaman
  cur.page = no;
  cur.verses = verses;
  cur.verseSet = new Set(verses);
  cur.words = words;
  cur.surahs = (data.surahs || []).map(s => ({ id: s.id, from: s.verse_start, to: s.verse_end }));
  if (!cur.surahs.length && verses.length) {
    const [surahId] = parseKey(verses[0]);
    cur.surahs = [{ id: surahId, from: 1, to: surahVerseCount(surahId) }];
  }

  // 4) Pas-kan ke halaman, lalu beri tahu modul lain
  rememberWidth();
  fit();
  emit("page:rendered", no);
  return true;
}

/** Tampilan galat dengan tombol "Coba lagi". */
function showError(no, onRetry) {
  els.teks.classList.remove("memuat");
  els.teks.removeAttribute("aria-busy");

  const box = h("div", "galat");
  box.append(h("p", null, `Halaman ${no} belum bisa dimuat. Periksa koneksi internet Anda lalu coba lagi.`));

  const button = h("button", null, "Coba lagi");
  button.type = "button";
  button.prepend(icon("refresh"));
  button.addEventListener("click", onRetry);
  box.append(button);

  els.teks.replaceChildren(box);
}
