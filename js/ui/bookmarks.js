/**
 * ui/bookmarks.js — Penanda halaman & tanda "sudah hafal".
 */
import { surahName } from "../data/surah.js";
import { els, h, icon } from "../core/dom.js";
import { on } from "../core/events.js";
import { S, persist } from "../core/state.js";
import { juzOf } from "../core/utils.js";
import { cur } from "../reader/page-model.js";
import { goto } from "../reader/navigation.js";
import { toast } from "./toast.js";
import { updateChrome } from "./chrome.js";
import { renderProgress } from "./progress.js";

/** Menyimpan perubahan lalu menyegarkan tampilan yang terkait. */
function commit() {
  persist();
  updateChrome();
  renderBookmarks();
}

/** Menambah penanda untuk halaman ini, atau menghapusnya bila sudah ada. */
export function toggleBookmark() {
  const page = cur.page || S.page;
  const index = S.bookmarks.findIndex(b => b.page === page);

  if (index >= 0) {
    const [removed] = S.bookmarks.splice(index, 1);
    commit();
    toast("Penanda dihapus", { action: { label: "Urungkan", fn: () => { S.bookmarks.push(removed); commit(); } } });
  } else {
    S.bookmarks.push({
      page,
      surah: cur.surahs.map(s => surahName(s.id)).join(" · "),
      juz: juzOf(page),
      ts: Date.now()
    });
    commit();
    toast(`Halaman ${page} disimpan sebagai penanda`);
  }
}

/** Menggambar daftar penanda di dialog "Penanda halaman". */
export function renderBookmarks() {
  const list = els.bmList;
  list.replaceChildren();

  if (!S.bookmarks.length) {
    list.append(h("li", "kosong", "Belum ada penanda. Ketuk ikon penanda untuk menyimpan halaman."));
    return;
  }

  [...S.bookmarks].sort((a, b) => a.page - b.page).forEach(bm => {
    const li = h("li");

    // Tombol utama: buka halaman penanda
    const item = h("button", "item" + (bm.page === cur.page ? " aktif" : ""));
    item.type = "button";
    const date = new Date(bm.ts || Date.now())
      .toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    const name = h("span", "nm");
    name.append(
      h("b", null, bm.surah || "Halaman " + bm.page),
      h("small", null, `Halaman ${bm.page} · Juz ${bm.juz} · ${date}`)
    );
    item.append(h("span", "no", String(bm.page)), name);
    item.addEventListener("click", () => { els.dlgBm.close(); goto(bm.page); });

    // Tombol hapus (bisa diurungkan)
    const del = h("button", "btn-hapus");
    del.type = "button";
    del.setAttribute("aria-label", "Hapus penanda halaman " + bm.page);
    del.append(icon("trash"));
    del.addEventListener("click", () => {
      S.bookmarks = S.bookmarks.filter(b => b.page !== bm.page);
      commit();
      toast("Penanda dihapus", { action: { label: "Urungkan", fn: () => { S.bookmarks.push(bm); commit(); } } });
    });

    li.append(item, del);
    list.append(li);
  });
}

/** Menandai halaman ini sudah dihafal, atau mencabut tandanya. */
export function toggleMemo() {
  const page = cur.page || S.page;
  if (S.memorized[page]) {
    delete S.memorized[page];
    toast(`Tanda hafal halaman ${page} dicabut`);
  } else {
    S.memorized[page] = Date.now();
    toast(`Halaman ${page} ditandai hafal. Barakallahu fiik!`);
  }
  persist();
  updateChrome();
  if (els.dlgPrg.open) renderProgress();
}

export function initBookmarks() {
  on("state:replaced", renderBookmarks);

  els.btnBookmark.addEventListener("click", toggleBookmark);
  els.btnMemo.addEventListener("click", toggleMemo);
  els.btnBookmarks.addEventListener("click", () => { renderBookmarks(); els.dlgBm.showModal(); });
  els.bmAdd.addEventListener("click", () => {
    if (S.bookmarks.some(b => b.page === cur.page)) toast("Halaman ini sudah ada di daftar penanda");
    else toggleBookmark();
  });
}
