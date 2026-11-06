/**
 * data/surah.js — Daftar 114 surat.
 *
 * Setiap baris berisi: [nama latin, nama arab, jumlah ayat, halaman awal].
 * Data dicocokkan dengan Quran.com API dan EveryAyah.
 * Gunakan fungsi bantu di bagian bawah, jangan mengakses indeks array langsung,
 * supaya kode lain mudah dibaca.
 */
export const SURAH = [
  ["Al-Fatihah","الفاتحة",7,1],["Al-Baqarah","البقرة",286,2],["Ali 'Imran","آل عمران",200,50],["An-Nisa'","النساء",176,77],
  ["Al-Ma'idah","المائدة",120,106],["Al-An'am","الأنعام",165,128],["Al-A'raf","الأعراف",206,151],["Al-Anfal","الأنفال",75,177],
  ["At-Taubah","التوبة",129,187],["Yunus","يونس",109,208],["Hud","هود",123,221],["Yusuf","يوسف",111,235],
  ["Ar-Ra'd","الرعد",43,249],["Ibrahim","ابراهيم",52,255],["Al-Hijr","الحجر",99,262],["An-Nahl","النحل",128,267],
  ["Al-Isra'","الإسراء",111,282],["Al-Kahf","الكهف",110,293],["Maryam","مريم",98,305],["Ta-Ha","طه",135,312],
  ["Al-Anbiya'","الأنبياء",112,322],["Al-Hajj","الحج",78,332],["Al-Mu'minun","المؤمنون",118,342],["An-Nur","النور",64,350],
  ["Al-Furqan","الفرقان",77,359],["Asy-Syu'ara'","الشعراء",227,367],["An-Naml","النمل",93,377],["Al-Qasas","القصص",88,385],
  ["Al-Ankabut","العنكبوت",69,396],["Ar-Rum","الروم",60,404],["Luqman","لقمان",34,411],["As-Sajdah","السجدة",30,415],
  ["Al-Ahzab","الأحزاب",73,418],["Saba'","سبإ",54,428],["Fatir","فاطر",45,434],["Ya-Sin","يس",83,440],
  ["Ash-Shaffat","الصافات",182,446],["Sad","ص",88,453],["Az-Zumar","الزمر",75,458],["Ghafir","غافر",85,467],
  ["Fussilat","فصلت",54,477],["Asy-Syura","الشورى",53,483],["Az-Zukhruf","الزخرف",89,489],["Ad-Dukhan","الدخان",59,496],
  ["Al-Jatsiyah","الجاثية",37,499],["Al-Ahqaf","الأحقاف",35,502],["Muhammad","محمد",38,507],["Al-Fath","الفتح",29,511],
  ["Al-Hujurat","الحجرات",18,515],["Qaf","ق",45,518],["Adz-Dzariyat","الذاريات",60,520],["At-Tur","الطور",49,523],
  ["An-Najm","النجم",62,526],["Al-Qamar","القمر",55,528],["Ar-Rahman","الرحمن",78,531],["Al-Waqi'ah","الواقعة",96,534],
  ["Al-Hadid","الحديد",29,537],["Al-Mujadilah","المجادلة",22,542],["Al-Hasyr","الحشر",24,545],["Al-Mumtahanah","الممتحنة",13,549],
  ["Ash-Shaff","الصف",14,551],["Al-Jumu'ah","الجمعة",11,553],["Al-Munafiqun","المنافقون",11,554],["At-Taghabun","التغابن",18,556],
  ["At-Talaq","الطلاق",12,558],["At-Tahrim","التحريم",12,560],["Al-Mulk","الملك",30,562],["Al-Qalam","القلم",52,564],
  ["Al-Haqqah","الحاقة",52,566],["Al-Ma'arij","المعارج",44,568],["Nuh","نوح",28,570],["Al-Jinn","الجن",28,572],
  ["Al-Muzzammil","المزمل",20,574],["Al-Muddatstsir","المدثر",56,575],["Al-Qiyamah","القيامة",40,577],["Al-Insan","الانسان",31,578],
  ["Al-Mursalat","المرسلات",50,580],["An-Naba'","النبإ",40,582],["An-Nazi'at","النازعات",46,583],["'Abasa","عبس",42,585],
  ["At-Takwir","التكوير",29,586],["Al-Infitar","الإنفطار",19,587],["Al-Muthaffifin","المطففين",36,587],["Al-Insiqaq","الإنشقاق",25,589],
  ["Al-Buruj","البروج",22,590],["At-Tariq","الطارق",17,591],["Al-A'la","الأعلى",19,591],["Al-Ghasyiyah","الغاشية",26,592],
  ["Al-Fajr","الفجر",30,593],["Al-Balad","البلد",20,594],["Asy-Syams","الشمس",15,595],["Al-Lail","الليل",21,595],
  ["Ad-Duha","الضحى",11,596],["Asy-Syarh","الشرح",8,596],["At-Tin","التين",8,597],["Al-'Alaq","العلق",19,597],
  ["Al-Qadr","القدر",5,598],["Al-Bayyinah","البينة",8,598],["Az-Zalzalah","الزلزلة",8,599],["Al-'Adiyat","العاديات",11,599],
  ["Al-Qari'ah","القارعة",11,600],["At-Takatsur","التكاثر",8,600],["Al-'Asr","العصر",3,601],["Al-Humazah","الهمزة",9,601],
  ["Al-Fiil","الفيل",5,601],["Quraisy","قريش",4,602],["Al-Ma'un","الماعون",7,602],["Al-Kautsar","الكوثر",3,602],
  ["Al-Kafirun","الكافرون",6,603],["An-Nasr","النصر",3,603],["Al-Lahab","المسد",5,603],["Al-Ikhlas","الإخلاص",4,604],
  ["Al-Falaq","الفلق",5,604],["An-Nas","الناس",6,604]
];

/** Nama latin surat. Contoh: surahName(1) → "Al-Fatihah" */
export const surahName = id => SURAH[id - 1][0];

/** Nama arab surat. Contoh: surahArabic(1) → "الفاتحة" */
export const surahArabic = id => SURAH[id - 1][1];

/** Jumlah ayat dalam surat. */
export const surahVerseCount = id => SURAH[id - 1][2];

/** Nomor halaman mushaf tempat surat dimulai. */
export const surahStartPage = id => SURAH[id - 1][3];

/** Nomor ayat global (1–6236) dari pasangan surat:ayat. Dipakai server audio cadangan. */
export function globalAyah(surahId, ayah) {
  let total = 0;
  for (let i = 1; i < surahId; i++) total += surahVerseCount(i);
  return total + ayah;
}
