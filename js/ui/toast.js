/**
 * ui/toast.js — Pesan singkat yang muncul di bawah layar.
 *
 *   toast("Tersimpan");
 *   toast("Penanda dihapus", { action: { label: "Urungkan", fn: () => ... } });
 *   toast("Pesan lama", { ms: 8000 });   // tampil 8 detik
 */
import { els, h } from "../core/dom.js";

const MAX_VISIBLE = 3;
const DEFAULT_MS = 4200;

export function toast(message, options = {}) {
  const el = h("div", "toast");
  el.append(h("span", null, message));

  if (options.action) {
    const button = h("button", null, options.action.label);
    button.type = "button";
    button.addEventListener("click", () => { options.action.fn(); el.remove(); });
    el.append(button);
  }

  els.toasts.append(el);
  while (els.toasts.children.length > MAX_VISIBLE) els.toasts.firstChild.remove();
  setTimeout(() => el.remove(), options.ms || DEFAULT_MS);
}
