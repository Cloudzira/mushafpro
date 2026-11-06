/**
 * reader/page-model.js — Keadaan halaman mushaf yang sedang ditampilkan.
 *
 * Objek `cur` (current) diisi oleh renderer.js setiap halaman selesai digambar,
 * dan dibaca oleh modul lain (pemilihan ayat, audio, navigasi).
 */
export const cur = {
  page: 0,               // nomor halaman yang tampil (0 = belum ada)
  verses: [],            // daftar verse_key berurutan di halaman ini, mis. ["2:1", "2:2"]
  verseSet: new Set(),   // versi Set dari `verses` (pencarian cepat)
  words: new Map(),      // verse_key → daftar elemen kata (<span class="kata">)
  surahs: [],            // surat di halaman ini: [{ id, from, to }]
  sel: null              // verse_key ayat yang sedang dipilih (atau null)
};
