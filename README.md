# Mushaf Tahfidz Pro

Mushaf Madinah 604 halaman untuk membaca dan menghafal Al-Qur'an: mode tutup ayat, audio per ayat
dengan pengulangan, penanda, pelacak hafalan, sinkronisasi Google, dan bisa dipasang sebagai aplikasi (PWA).

## Cara menjalankan

Aplikasi memakai ES Module, jadi **tidak bisa dibuka dengan klik dua kali** pada `index.html`.
Jalankan lewat server lokal, misalnya:

```bash
npx serve .          # atau
python3 -m http.server 8080
```

lalu buka `http://localhost:8080`. Untuk produksi, unggah seluruh folder ke GitHub Pages / Vercel / Netlify.

## Struktur proyek

```
index.html              Kerangka halaman & seluruh dialog
manifest.webmanifest    Pengaturan PWA (nama, ikon, warna)
sw.js                   Service worker (mode luring)
icon.svg                Ikon aplikasi

css/                    Dimuat berurutan dari dasar ke khusus
  01-tokens.css           Variabel warna, jarak, tema terang/gelap/sepia
  02-base.css             Reset, tipografi, aksesibilitas, ikon
  03-layout.css           Bilah atas, toolbar, footer, layar pembuka
  04-mushaf.css           Bingkai halaman, baris, kata, mode hafalan
  05-components.css       Tombol, menu, formulir, daftar, toast
  06-dialogs.css          Dialog, Navigasi, Progres, Pengaturan, Tentang
  07-player.css           Kartu ayat & pemutar audio
  08-responsive.css       Layar kecil, sentuh, landscape, cetak

js/
  main.js                 Titik masuk: menyalakan semua modul
  config.js               Semua konstanta (URL, ukuran, batas waktu)
  data/                   surah.js · juz.js · reciters.js
  core/                   utils · dom · events · logger · storage · media · state
  services/               quran-api (data) · cloud (Firebase) · pwa (pasang aplikasi)
  reader/                 page-model · renderer · fit · navigation · selection · ayat-sheet · viewport
  audio/                  sources (server audio) · player (mesin pemutar)
  ui/                     chrome · theme · toolbar · navigator · bookmarks · progress · settings · shortcuts · toast
```

## Alur singkat

1. `main.js` menyalakan semua modul, lalu memanggil `goto(halaman terakhir)`.
2. `reader/navigation.js` → `reader/renderer.js` mengunduh data halaman + font dan menggambar baris/kata.
3. Setelah selesai, renderer mengumumkan event `page:rendered`; modul lain (chrome, mode hafalan, audio) menyesuaikan diri.
4. Perubahan data pengguna lewat `core/state.js` (`persist()`), lalu `services/cloud.js` menyinkronkannya bila sudah login.

Antar-modul berkomunikasi lewat `core/events.js` supaya tidak saling bergantung berlebihan.
Daftar event ada di komentar bagian atas file tersebut.

## Tips pengembangan

- Mengubah warna / jarak / bentuk: `css/01-tokens.css`.
- Mengubah alamat server, ukuran, batas waktu: `js/config.js`.
- Menambah qari: `js/data/reciters.js`.
- Menambah/menghapus berkas CSS atau JS: perbarui daftar `SHELL` di `sw.js` dan naikkan `VERSION`.

## Sumber data

- Teks & font mushaf: QCF v4 (Mushaf Madinah)
- Peta ayat, halaman & terjemahan Kemenag: Quran.com API
- Audio murattal: EveryAyah.com

Crafted with ♥ by [Kurniapedia](https://kurniapedia.my.id)
