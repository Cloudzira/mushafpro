/**
 * ui/progress.js — Dialog "Progres hafalan" (total & per juz).
 */
import { PAGES } from "../config.js";
import { els, h } from "../core/dom.js";
import { S } from "../core/state.js";
import { juzOf, juzRange } from "../core/utils.js";
import { cur } from "../reader/page-model.js";
import { goto } from "../reader/navigation.js";
import { toggleMemo } from "./bookmarks.js";

/** Menggambar ulang seluruh isi dialog progres. */
export function renderProgress() {
  const page = cur.page || S.page;
  const total = Object.keys(S.memorized).length;
  const percent = total / PAGES * 100;

  els.prgText.textContent = `${total} / ${PAGES} halaman`;
  els.prgPct.textContent = percent.toFixed(total && total < 60 ? 1 : 0).replace(".", ",") + "%";
  els.prgBar.style.width = percent + "%";

  els.prgJuz.replaceChildren();
  for (let juz = 1; juz <= 30; juz++) {
    const [first, last] = juzRange(juz);
    const length = last - first + 1;
    let done = 0;
    for (let p = first; p <= last; p++) if (S.memorized[p]) done++;

    const item = h("button", "item" + (juzOf(page) === juz ? " aktif" : ""));
    item.type = "button";

    const bar = h("div", "bar");
    const fill = h("i");
    fill.style.width = (done / length * 100) + "%";
    bar.append(fill);

    const name = h("span", "nm");
    name.append(h("b", null, "Juz " + juz), bar);

    item.append(h("span", "no", String(juz)), name, h("span", "cnt", `${done}/${length}`));
    item.addEventListener("click", () => { els.dlgPrg.close(); goto(first); });

    const li = h("li");
    li.append(item);
    els.prgJuz.append(li);
  }

  els.prgMark.textContent = S.memorized[page] ? "Cabut tanda hafal halaman ini" : "Tandai halaman ini hafal";
}

export function initProgress() {
  els.btnProgress.addEventListener("click", () => { renderProgress(); els.dlgPrg.showModal(); });
  els.prgMark.addEventListener("click", toggleMemo);
}
