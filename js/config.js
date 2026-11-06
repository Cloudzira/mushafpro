/**
 * config.js — Semua konstanta aplikasi dikumpulkan di satu tempat.
 *
 * Ingin mengubah alamat server, ukuran tata letak, atau batas waktu?
 * Cukup ubah di file ini; file lain tidak perlu disentuh.
 */

/* ---------------------------------------------------------------
   Identitas aplikasi
   --------------------------------------------------------------- */
export const APP = {
  name: "Mushaf Tahfidz Pro",
  version: "6.0.0"
};

/* ---------------------------------------------------------------
   Mushaf
   --------------------------------------------------------------- */
export const PAGES = 604;        // jumlah halaman mushaf Madinah
export const PAGE_LINES = 15;    // jumlah baris per halaman

/* ---------------------------------------------------------------
   Sumber data eksternal (semuanya gratis)
   --------------------------------------------------------------- */
export const JSON_URL  = "https://raw.githubusercontent.com/MohamadHajjRabee/quran-qcf4/main/pages/"; // teks per halaman
export const FONT_URL  = "https://cdn.jsdelivr.net/gh/MohamadHajjRabee/quran-qcf4@main/fonts-woff2/";   // font QCF v4
export const AUDIO_URL = "https://everyayah.com/data/";                                                  // audio utama
export const API_URL   = "https://api.quran.com/api/v4";                                                 // terjemahan & peta ayat
export const TRANSLATION_ID = 33;                                                                        // Terjemahan Kemenag RI

// Server audio cadangan (lihat data/reciters.js)
export const QC_CDN  = "https://verses.quran.foundation/";
export const ISL_CDN = "https://cdn.islamic.app/quran/audio/";
export const FALLBACK_QARI = "Alafasy_128kbps";   // qari pengganti bila server qari pilihan gagal

/* ---------------------------------------------------------------
   Tata letak halaman mushaf (dipakai oleh reader/fit.js)
   --------------------------------------------------------------- */
export const LAYOUT = {
  GAP_EM: 0.12,          // jarak antar kata (satuan em); harus sama dengan CSS .baris
  MOBILE_GAP_EM: 0.04,   // jarak antar kata pada ponsel potret
  PITCH: 2.0,            // tinggi baris = ukuran font × PITCH
  SHORT_LINE: 0.72,      // baris yang lebarnya < 72% dianggap "pendek" (rata kanan)
  FIT_SLACK: 0.985       // sisakan 1,5% lebar agar teks tidak menyentuh tepi
};

/* ---------------------------------------------------------------
   Penyimpanan lokal
   --------------------------------------------------------------- */
export const STORAGE_KEY = "mushaf_v2";   // kunci data utama di localStorage
export const UID_KEY = "mushaf_uid";      // akun Google yang terakhir tersambung

/* ---------------------------------------------------------------
   Audio
   --------------------------------------------------------------- */
export const PLAY_TIMEOUT = 9000;    // ms menunggu satu server audio sebelum pindah ke server lain
export const BAD_HOST_TTL = 180000;  // ms server yang macet diingat (3 menit)

/* ---------------------------------------------------------------
   Pilihan yang sah untuk setiap pengaturan.
   Dipakai untuk memeriksa data (mis. dari berkas cadangan) sebelum dipakai.
   --------------------------------------------------------------- */
export const OPTIONS = {
  theme: ["auto", "light", "dark", "sepia"],
  hideMode: ["normal", "blur", "first"],
  audioMode: ["page", "ayah", "range", "surah"],
  repeatAyah: [1, 2, 3, 5, 7, 10, 0],       // 0 = tanpa batas
  repeatRange: [1, 2, 3, 5, 10, 0],         // 0 = tanpa batas
  speed: [0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.5],
  gap: [0, 1, 2, 3, -1]                     // -1 = sepanjang ayat (giliran pengguna)
};

/* ---------------------------------------------------------------
   Firebase (login Google & sinkronisasi antar perangkat)
   Kunci web Firebase memang publik; keamanan data diatur lewat Firestore Rules.
   --------------------------------------------------------------- */
export const FIREBASE_SDK_URL = "https://www.gstatic.com/firebasejs/10.8.0/";
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCDU5f4iBXSwlKYYJUO6bb72r1VBVLAg3I",
  authDomain: "mushafpro-e80e1.firebaseapp.com",
  projectId: "mushafpro-e80e1",
  storageBucket: "mushafpro-e80e1.firebasestorage.app",
  messagingSenderId: "416657395563",
  appId: "1:416657395563:web:842ee40f5e180c22bb862e"
};
