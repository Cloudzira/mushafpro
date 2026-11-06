/**
 * data/reciters.js — Daftar qari (pelantun) dan server audio cadangannya.
 *
 * "id" adalah nama folder qari di everyayah.com.
 * "nama" adalah nama yang ditampilkan kepada pengguna.
 */
export const QARI = [
  { id: "Alafasy_128kbps",                 nama: "Mishary Rashid Alafasy" },
  { id: "Husary_128kbps",                  nama: "Mahmoud Khalil Al-Husary" },
  { id: "Husary_Muallim_128kbps",          nama: "Al-Husary (Mu'allim, untuk belajar)" },
  { id: "Minshawy_Murattal_128kbps",       nama: "Muhammad Siddiq Al-Minshawi" },
  { id: "Abdul_Basit_Murattal_192kbps",    nama: "Abdul Basit (Murattal)" },
  { id: "Abdurrahmaan_As-Sudais_192kbps",  nama: "Abdurrahman As-Sudais" },
  { id: "Saood_ash-Shuraym_128kbps",       nama: "Saud Asy-Syuraim" },
  { id: "MaherAlMuaiqly128kbps",           nama: "Maher Al-Muaiqly" },
  { id: "Hudhaify_128kbps",                nama: "Ali Al-Hudzaifi" },
  { id: "Abu_Bakr_Ash-Shaatree_128kbps",   nama: "Abu Bakr Asy-Syatiri" },
  { id: "Muhammad_Ayyoub_128kbps",         nama: "Muhammad Ayyub" },
  { id: "Yasser_Ad-Dussary_128kbps",       nama: "Yasser Ad-Dausari" },
  { id: "Nasser_Alqatami_128kbps",         nama: "Nasser Al-Qatami" },
  { id: "Salah_Al_Budair_128kbps",         nama: "Salah Al-Budair" },
  { id: "Abdullah_Matroud_128kbps",        nama: "Abdullah Matroud" },
  { id: "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net", nama: "Ahmad Al-Ajmi" }
];

/**
 * Server audio cadangan. Bila everyayah.com lambat atau terblokir,
 * aplikasi otomatis mencoba alamat-alamat ini secara berurutan.
 *   qc  = verses.quran.foundation
 *   isl = cdn.islamic.app
 */
export const MIRRORS = {
  "Alafasy_128kbps":                { qc: "Alafasy/mp3", isl: "ar.alafasy" },
  "Husary_128kbps":                 { qc: "Husary/mp3" },
  "Husary_Muallim_128kbps":         { qc: "Husary/Muallim/mp3" },
  "Minshawy_Murattal_128kbps":      { qc: "Minshawi/Murattal/mp3" },
  "Abdul_Basit_Murattal_192kbps":   { qc: "AbdulBaset/Murattal/mp3" },
  "Abdurrahmaan_As-Sudais_192kbps": { qc: "Sudais/mp3", isl: "ar.abdurrahmaansudais" },
  "Saood_ash-Shuraym_128kbps":      { qc: "Shuraym/mp3" }
};
