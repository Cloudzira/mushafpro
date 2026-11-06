/**
 * core/events.js — "Papan pengumuman" sederhana antar modul.
 *
 * Mengapa perlu? Agar satu modul bisa memberi tahu modul lain
 * ("halaman selesai dirender!") TANPA saling mengimpor.
 * Hasilnya kode lebih longgar dan tidak berputar-putar (circular import).
 *
 * Daftar event yang dipakai aplikasi:
 *   page:rendered   → halaman mushaf selesai digambar        (payload: nomor halaman)
 *   state:saved     → data pengguna baru saja disimpan        (tanpa payload)
 *   state:replaced  → seluruh data diganti (impor / sinkron)  (tanpa payload)
 *   sheet:show      → kartu ayat perlu ditampilkan            (payload: verse_key)
 *   sheet:hide      → kartu ayat perlu disembunyikan          (tanpa payload)
 */
const handlers = new Map();

/** Mendaftarkan fungsi yang dipanggil setiap kali `event` diumumkan. */
export function on(event, fn) {
  if (!handlers.has(event)) handlers.set(event, []);
  handlers.get(event).push(fn);
}

/** Mengumumkan `event` kepada semua yang mendaftar. Galat satu pendengar tidak memutus yang lain. */
export function emit(event, payload) {
  (handlers.get(event) || []).forEach(fn => {
    try { fn(payload); } catch (err) { console.warn("Galat pada event", event, err); }
  });
}
