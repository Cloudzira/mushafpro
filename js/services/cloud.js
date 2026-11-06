/**
 * services/cloud.js — Login Google & sinkronisasi antar perangkat (Firebase).
 *
 * Firebase dimuat "malas" (lazy) lewat import(). Bila gagal dimuat (mis. luring),
 * aplikasi tetap berjalan normal memakai data lokal.
 */
import { FIREBASE_CONFIG, FIREBASE_SDK_URL, UID_KEY } from "../config.js";
import { els } from "../core/dom.js";
import { on, emit } from "../core/events.js";
import { LS } from "../core/storage.js";
import { S, sanitize, replaceState } from "../core/state.js";
import { debounce } from "../core/utils.js";
import { toast } from "../ui/toast.js";
import { goto, hasUserNavigated } from "../reader/navigation.js";

const Cloud = { ok: false, user: null, auth: null, db: null, provider: null, authApi: null, dbApi: null };

/** Memuat Firebase dan mulai memantau status login. */
export async function initCloud() {
  // Setiap data lokal tersimpan → kirim ke awan 2 detik kemudian (bila sudah login)
  on("state:saved", debounce(pushToCloud, 2000));

  try {
    const [appApi, authApi, dbApi] = await Promise.all([
      import(FIREBASE_SDK_URL + "firebase-app.js"),
      import(FIREBASE_SDK_URL + "firebase-auth.js"),
      import(FIREBASE_SDK_URL + "firebase-firestore.js")
    ]);
    const app = appApi.initializeApp(FIREBASE_CONFIG);
    Cloud.auth = authApi.getAuth(app);
    Cloud.db = dbApi.getFirestore(app);
    Cloud.provider = new authApi.GoogleAuthProvider();
    Cloud.authApi = authApi;
    Cloud.dbApi = dbApi;
    Cloud.ok = true;
    authApi.onAuthStateChanged(Cloud.auth, handleAuthChange);
  } catch (err) {
    console.warn("Firebase tidak tersedia:", err);
    els.userStatus.textContent = "Luring";
    els.authBtn.disabled = true;
  }

  els.authBtn.addEventListener("click", toggleLogin);
}

/** Dipanggil Firebase setiap status login berubah. */
function handleAuthChange(user) {
  Cloud.user = user;
  if (user) {
    els.userStatus.textContent = (user.displayName || user.email || "Akun").split(" ")[0];
    els.authBtn.textContent = "Keluar";
    pullFromCloud();
  } else {
    els.userStatus.textContent = "Tamu";
    els.authBtn.textContent = "Masuk";
  }
}

/** Tombol Masuk / Keluar. */
async function toggleLogin() {
  if (!Cloud.ok) { toast("Sinkronisasi belum tersedia (luring)."); return; }
  try {
    if (Cloud.user) {
      await Cloud.authApi.signOut(Cloud.auth);
      toast("Anda telah keluar. Data tetap tersimpan di perangkat ini.");
    } else {
      await Cloud.authApi.signInWithPopup(Cloud.auth, Cloud.provider);
    }
  } catch (err) {
    // Popup diblokir browser → coba cara pengalihan halaman
    if (err && err.code === "auth/popup-blocked") {
      try { await Cloud.authApi.signInWithRedirect(Cloud.auth, Cloud.provider); return; } catch { /* lanjut ke pesan galat */ }
    }
    if (!err || err.code !== "auth/popup-closed-by-user") toast("Gagal masuk. Coba lagi.");
  }
}

/** Dokumen milik pengguna di Firestore: progres_hafalan/{uid} */
const cloudDoc = () => Cloud.dbApi.doc(Cloud.db, "progres_hafalan", Cloud.user.uid);

/** Mengirim data lokal ke awan. */
async function pushToCloud() {
  if (!Cloud.ok || !Cloud.user) return;
  try {
    await Cloud.dbApi.setDoc(cloudDoc(), {
      halaman_terakhir: S.page,
      page: S.page,
      bookmarks: S.bookmarks,
      memorized: S.memorized,
      settings: S.settings,
      updatedAt: S.updatedAt,
      updated_at: new Date(S.updatedAt || Date.now()).toISOString()
    }, { merge: true });
  } catch (err) { console.warn("Gagal sinkron:", err); }
}

/**
 * Menggabungkan data lokal & awan (dipakai saat pertama kali login di perangkat ini):
 * penanda & hafalan digabung, halaman/pengaturan mengikuti data yang lebih baru.
 */
function mergeStates(local, cloud) {
  const merged = sanitize(local);

  const byPage = new Map();
  [...cloud.bookmarks, ...local.bookmarks].forEach(b => {
    const existing = byPage.get(b.page);
    if (!existing || b.ts > existing.ts) byPage.set(b.page, b);
  });
  merged.bookmarks = [...byPage.values()];

  merged.memorized = { ...cloud.memorized, ...local.memorized };

  const cloudIsNewer = cloud.updatedAt > local.updatedAt;
  merged.page = cloudIsNewer ? cloud.page : local.page;
  merged.settings = cloudIsNewer ? { ...local.settings, ...cloud.settings } : { ...local.settings };
  merged.updatedAt = Date.now();
  return merged;
}

/** Mengambil data dari awan dan menyelaraskannya dengan data lokal. */
async function pullFromCloud() {
  try {
    const snapshot = await Cloud.dbApi.getDoc(cloudDoc());
    if (!snapshot.exists()) { await pushToCloud(); return; }   // akun baru: unggah data lokal

    const cloud = sanitize(snapshot.data());
    const alreadyLinked = LS.get(UID_KEY, "") === Cloud.user.uid;
    let next;

    if (!alreadyLinked) {                       // login pertama di perangkat ini → gabungkan
      next = mergeStates(S, cloud);
      LS.set(UID_KEY, Cloud.user.uid);
    } else if (cloud.updatedAt > S.updatedAt) { // data awan lebih baru → pakai data awan
      next = cloud;
    } else {                                    // data lokal lebih baru → kirim ke awan
      await pushToCloud();
      return;
    }

    const pageChanged = next.page !== S.page;
    replaceState(next);                         // juga menyimpan ke localStorage
    emit("state:replaced");
    if (pageChanged && !hasUserNavigated()) goto(next.page, { auto: true });
    if (!alreadyLinked) pushToCloud();
    toast("Data tersinkron dari akun Anda");
  } catch (err) { console.warn("Gagal menarik data awan:", err); }
}

