/**
 * ui/navigator.js — Dialog "Navigasi": pilih surat, juz, ayat, atau nomor halaman.
 */
import { PAGES } from "../config.js";
import { SURAH, surahName, surahVerseCount, surahStartPage } from "../data/surah.js";
import { JUZ_START } from "../data/juz.js";
import { els, h, $$ } from "../core/dom.js";
import { S } from "../core/state.js";
import { juzOf, normalize } from "../core/utils.js";
import { cur } from "../reader/page-model.js";
import { goto, versePage } from "../reader/navigation.js";
import { selectVerse } from "../reader/selection.js";
import { toast } from "./toast.js";

const TABS = {
  surat:   ["tabSurat", "panSurat"],
  juz:     ["tabJuz", "panJuz"],
  ayat:    ["tabAyat", "panAyat"],
  halaman: ["tabHalaman", "panHalaman"]
};

/** Mengisi daftar surat, kotak juz, dan pilihan surat (sekali saat aplikasi mulai). */
function buildLists() {
  // Daftar surat
  const fragment = document.createDocumentFragment();
  SURAH.forEach((surah, index) => {
    const id = index + 1;
    const li = h("li");
    li.dataset.q = normalize(`${id} ${surah[0]} ${surah[1]}`);   // teks untuk pencarian

    const button = h("button", "item");
    button.type = "button";
    const name = h("span", "nm");
    name.append(h("b", null, surah[0]), h("small", null, `${surah[2]} ayat · hal. ${surah[3]}`));
    button.append(h("span", "no", String(id)), name, h("span", "ar", surah[1]));
    button.addEventListener("click", () => { els.dlgNav.close(); goto(surahStartPage(id)); });

    li.append(button);
    fragment.append(li);
  });
  els.listSurat.replaceChildren(fragment);

  // Kotak juz 1–30
  els.gridJuz.replaceChildren();
  for (let juz = 1; juz <= 30; juz++) {
    const button = h("button", null, String(juz));
    button.type = "button";
    button.setAttribute("aria-label", `Juz ${juz}, halaman ${JUZ_START[juz - 1]}`);
    button.addEventListener("click", () => { els.dlgNav.close(); goto(JUZ_START[juz - 1]); });
    els.gridJuz.append(button);
  }

  // Pilihan surat pada tab "Ayat"
  SURAH.forEach((surah, index) => els.ayatSurah.append(new Option(`${index + 1}. ${surah[0]}`, index + 1)));
}

/** Menyaring daftar surat sesuai ketikan; "2:255" membuka jalan pintas ke ayat. */
function filterSurat() {
  const raw = els.navSearch.value.trim();
  const query = normalize(raw);
  const verseMatch = raw.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);

  $$(".lompat-ayat", els.listSurat).forEach(el => el.remove());
  $$("li[data-q]", els.listSurat).forEach(li => { li.hidden = !!query && !li.dataset.q.includes(query); });

  if (verseMatch) {
    const surahId = Number(verseMatch[1]);
    const ayah = Number(verseMatch[2]);
    if (surahId >= 1 && surahId <= 114) {
      const li = h("li", "lompat-ayat");
      const button = h("button", "item lompat", `Buka QS ${surahName(surahId)} ayat ${ayah}`);
      button.type = "button";
      button.addEventListener("click", () => jumpToVerse(surahId, ayah));
      li.append(button);
      els.listSurat.prepend(li);
      $$("li[data-q]", els.listSurat).forEach(x => { x.hidden = true; });
    }
  }
}

/** Menampilkan tab tertentu (surat / juz / ayat / halaman). */
function setTab(name) {
  Object.entries(TABS).forEach(([key, [tabId, panelId]]) => {
    const active = key === name;
    els[tabId].setAttribute("aria-selected", String(active));
    els[tabId].tabIndex = active ? 0 : -1;
    els[panelId].hidden = !active;
  });
}

/** Membuka dialog navigasi pada tab tertentu. */
export function openNavigator(tab = "surat") {
  const activeSurah = cur.surahs[0] ? cur.surahs[0].id : 1;
  const page = cur.page || S.page;

  $$("#listSurat li[data-q] .item").forEach((b, i) => b.classList.toggle("aktif", i + 1 === activeSurah));
  $$("#gridJuz button").forEach((b, i) => b.classList.toggle("aktif", i + 1 === juzOf(page)));
  els.ayatSurah.value = activeSurah;
  els.pageNo.value = page;

  setTab(tab);
  els.navSearch.value = "";
  filterSurat();
  els.dlgNav.showModal();

  // Fokus otomatis ke kotak cari hanya di perangkat non-sentuh (agar papan ketik layar tidak mengganggu)
  if (tab === "surat" && !window.matchMedia("(pointer: coarse)").matches) {
    els.navSearch.focus({ preventScroll: true });
  }
}

/** Membuka ayat tertentu: cari halamannya, buka, lalu pilih ayatnya. */
async function jumpToVerse(surahId, ayah) {
  const total = surahVerseCount(surahId);
  if (!(ayah >= 1 && ayah <= total)) {
    toast(`${surahName(surahId)} hanya memiliki ${total} ayat`);
    return;
  }
  const key = surahId + ":" + ayah;
  els.dlgNav.close();
  try {
    const page = await versePage(key);
    await goto(page);
    if (cur.words.has(key)) selectVerse(key, { sheet: false });
  } catch {
    toast("Tidak bisa mencari halaman ayat (luring). Membuka awal surat.");
    goto(surahStartPage(surahId));
  }
}

/** Membuka halaman berdasarkan nomor yang diketik. */
function jumpToPage() {
  const page = parseInt(els.pageNo.value, 10);
  if (!(page >= 1 && page <= PAGES)) {
    toast(`Masukkan nomor halaman 1–${PAGES}`);
    return;
  }
  els.dlgNav.close();
  goto(page);
}

export function initNavigator() {
  buildLists();

  els.btnNavOpen.addEventListener("click", () => openNavigator("surat"));

  // Tab
  Object.entries(TABS).forEach(([name, [tabId]]) => els[tabId].addEventListener("click", () => setTab(name)));
  const tabButtons = $$('#dlgNav [role="tablist"] button');
  tabButtons.forEach((button, index) => button.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const step = e.key === "ArrowRight" ? 1 : tabButtons.length - 1;
    const next = tabButtons[(index + step) % tabButtons.length];
    next.click();
    next.focus();
  }));

  // Cari surat
  els.navSearch.addEventListener("input", filterSurat);
  els.navSearch.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const first = els.listSurat.querySelector("li:not([hidden]) button");
    if (first) first.click();
  });

  // Tab Ayat
  els.ayatSurah.addEventListener("change", () => { els.ayatNo.max = surahVerseCount(Number(els.ayatSurah.value)); });
  els.ayatGo.addEventListener("click", () => jumpToVerse(Number(els.ayatSurah.value), parseInt(els.ayatNo.value, 10)));
  els.ayatNo.addEventListener("keydown", e => { if (e.key === "Enter") els.ayatGo.click(); });

  // Tab Halaman
  els.pageGo.addEventListener("click", jumpToPage);
  els.pageNo.addEventListener("keydown", e => { if (e.key === "Enter") jumpToPage(); });
}
