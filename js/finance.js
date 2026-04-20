// ============================================================
// Finance Helpers — Senetler, Kasa, Ödeme, Makbuz
// ============================================================
import { db } from "./firebase-config.js";
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, writeBatch,
  query, where, orderBy, Timestamp, serverTimestamp, increment,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================================
// TAKSİT PLANI OLUŞTUR
// ============================================================
/**
 * Bir öğrenci için otomatik taksit planı üretir.
 * @param {Object} params
 *   - studentId, studentAdi, veliTipi ("anne"|"baba"), veliAdi, veliTcNo
 *   - toplamTutar (Number), taksitSayisi (Number), ilkOdemeGunu (Date)
 *   - aciklama
 *   - createdByUid
 */
export async function createPromissoryPlan({
  studentId, studentAdi, veliTipi, veliAdi, veliTcNo,
  toplamTutar, taksitSayisi, ilkOdemeGunu, aciklama = "",
  createdByUid
}) {
  if (!studentId || !toplamTutar || !taksitSayisi || !ilkOdemeGunu) {
    throw new Error("Eksik bilgi: öğrenci, tutar, taksit sayısı ve ilk ödeme gerekli");
  }

  const taksitTutari = Math.round((toplamTutar / taksitSayisi) * 100) / 100;
  const sonTaksitTutari = Math.round((toplamTutar - (taksitTutari * (taksitSayisi - 1))) * 100) / 100;

  const taksitGrupId = crypto.randomUUID();
  const batch = writeBatch(db);
  const senetler = [];

  for (let i = 0; i < taksitSayisi; i++) {
    const vade = new Date(ilkOdemeGunu);
    vade.setMonth(vade.getMonth() + i);
    vade.setHours(0, 0, 0, 0);

    const tutar = (i === taksitSayisi - 1) ? sonTaksitTutari : taksitTutari;

    const senetDoc = {
      studentId,
      studentAdi,
      veliTipi,
      veliAdi,
      veliTcNo: veliTcNo || "",
      toplamTutar,
      taksitSayisi,
      taksitNo: i + 1,
      taksitTutari: tutar,
      vadeTarihi: Timestamp.fromDate(vade),
      durum: "bekliyor",
      odemeTarihi: null,
      odemeSekli: null,
      tahsilatMakbuzNo: null,
      taksitGrupId,
      aciklama,
      kasaHareketId: null,
      createdAt: serverTimestamp(),
      createdBy: createdByUid || null,
    };

    const ref = doc(collection(db, "promissoryNotes"));
    batch.set(ref, senetDoc);
    senetler.push({ id: ref.id, ...senetDoc });
  }

  await batch.commit();
  return { taksitGrupId, senetler, taksitTutari };
}

// ============================================================
// ÖDEME ALMA — Senet öde + Kasa hareketi + Makbuz no
// ============================================================
export async function payPromissory(senetId, {
  odemeSekli = "nakit",
  odemeTarihi = new Date(),
  aciklama = "",
  createdByUid
}) {
  const senetRef = doc(db, "promissoryNotes", senetId);
  const settingsRef = doc(db, "settings", "app");

  // Transaction: makbuz no atomic artırma, senet update, kasa ekleme
  const result = await runTransaction(db, async (tx) => {
    const senetSnap = await tx.get(senetRef);
    if (!senetSnap.exists()) throw new Error("Senet bulunamadı");
    const senet = senetSnap.data();
    if (senet.durum === "odendi") throw new Error("Bu taksit zaten ödenmiş");
    if (senet.durum === "iptal") throw new Error("İptal edilmiş taksit ödenemez");

    // Makbuz numarasını al (yoksa oluştur)
    const settingsSnap = await tx.get(settingsRef);
    let makbuzNo;
    if (settingsSnap.exists() && settingsSnap.data().tahsilatMakbuzSonNo) {
      makbuzNo = (settingsSnap.data().tahsilatMakbuzSonNo || 0) + 1;
      tx.update(settingsRef, {
        tahsilatMakbuzSonNo: makbuzNo,
        updatedAt: serverTimestamp()
      });
    } else {
      makbuzNo = 1001;
      tx.set(settingsRef, {
        tahsilatMakbuzSonNo: makbuzNo,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // Kasa hareketi ekle
    const kasaRef = doc(collection(db, "cashFlow"));
    tx.set(kasaRef, {
      tarih: Timestamp.fromDate(odemeTarihi),
      tip: "gelir",
      kategori: "senet_tahsilat",
      tutar: senet.taksitTutari,
      aciklama: `${senet.studentAdi} - ${senet.taksitNo}/${senet.taksitSayisi}. taksit` + (aciklama ? ` (${aciklama})` : ""),
      odemeSekli,
      iliskiliTip: "senet",
      iliskiliId: senetId,
      createdAt: serverTimestamp(),
      createdBy: createdByUid || null,
    });

    // Senet güncelle
    tx.update(senetRef, {
      durum: "odendi",
      odemeTarihi: Timestamp.fromDate(odemeTarihi),
      odemeSekli,
      tahsilatMakbuzNo: String(makbuzNo),
      kasaHareketId: kasaRef.id,
      updatedAt: serverTimestamp()
    });

    return { makbuzNo, kasaId: kasaRef.id };
  });

  return result;
}

// ============================================================
// ÖDEMEYİ GERİ AL (iptal)
// ============================================================
export async function unpayPromissory(senetId) {
  const senetRef = doc(db, "promissoryNotes", senetId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(senetRef);
    if (!snap.exists()) throw new Error("Senet bulunamadı");
    const s = snap.data();
    if (s.durum !== "odendi") throw new Error("Zaten ödenmiş değil");

    // Bağlı kasa hareketini sil
    if (s.kasaHareketId) {
      tx.delete(doc(db, "cashFlow", s.kasaHareketId));
    }
    tx.update(senetRef, {
      durum: "bekliyor",
      odemeTarihi: null,
      odemeSekli: null,
      tahsilatMakbuzNo: null,
      kasaHareketId: null,
      updatedAt: serverTimestamp()
    });
  });
}

// ============================================================
// SENET GRUBU SİL (planın tamamı)
// ============================================================
export async function deletePromissoryGroup(taksitGrupId) {
  const snap = await getDocs(query(
    collection(db, "promissoryNotes"),
    where("taksitGrupId", "==", taksitGrupId)
  ));
  const batch = writeBatch(db);
  let paidCount = 0;
  snap.forEach(d => {
    if (d.data().durum === "odendi") paidCount++;
    else batch.delete(d.ref);
  });
  if (paidCount > 0) {
    throw new Error(`Bu planda ${paidCount} adet ödenmiş taksit var. Önce ödemeleri geri almalısınız.`);
  }
  await batch.commit();
  return snap.size;
}

// ============================================================
// KASA HAREKETİ EKLE (manuel)
// ============================================================
export async function addCashFlow({
  tarih = new Date(),
  tip,              // "gelir" | "gider"
  kategori,
  tutar,
  aciklama = "",
  odemeSekli = "nakit",
  createdByUid
}) {
  if (!tip || !kategori || !tutar) throw new Error("Tip, kategori ve tutar zorunlu");
  return await addDoc(collection(db, "cashFlow"), {
    tarih: Timestamp.fromDate(tarih),
    tip,
    kategori,
    tutar: Number(tutar),
    aciklama,
    odemeSekli,
    iliskiliTip: null,
    iliskiliId: null,
    createdAt: serverTimestamp(),
    createdBy: createdByUid || null,
  });
}

// ============================================================
// KASA ÖZET (dönem bazlı)
// ============================================================
export async function getCashSummary(startDate, endDate) {
  const snap = await getDocs(query(
    collection(db, "cashFlow"),
    where("tarih", ">=", Timestamp.fromDate(startDate)),
    where("tarih", "<=", Timestamp.fromDate(endDate)),
    orderBy("tarih", "desc")
  ));
  let gelir = 0, gider = 0;
  const kategoriler = {};
  const hareketler = [];
  snap.forEach(d => {
    const h = { id: d.id, ...d.data() };
    hareketler.push(h);
    if (h.tip === "gelir") gelir += h.tutar || 0;
    else gider += h.tutar || 0;
    const key = `${h.tip}:${h.kategori}`;
    kategoriler[key] = (kategoriler[key] || 0) + (h.tutar || 0);
  });
  return { gelir, gider, net: gelir - gider, kategoriler, hareketler };
}

// ============================================================
// ÖĞRENCİ HESAP ÖZETİ
// ============================================================
export async function getStudentFinance(studentId) {
  const snap = await getDocs(query(
    collection(db, "promissoryNotes"),
    where("studentId", "==", studentId),
    orderBy("vadeTarihi", "asc")
  ));
  let toplam = 0, odenen = 0, bekleyen = 0, gecikmis = 0;
  const senetler = [];
  const today = new Date(); today.setHours(0,0,0,0);
  snap.forEach(d => {
    const s = { id: d.id, ...d.data() };
    senetler.push(s);
    toplam += s.taksitTutari || 0;
    if (s.durum === "odendi") odenen += s.taksitTutari || 0;
    else if (s.durum === "iptal") toplam -= s.taksitTutari || 0;
    else {
      bekleyen += s.taksitTutari || 0;
      const vade = s.vadeTarihi.toDate();
      if (vade < today) gecikmis += s.taksitTutari || 0;
    }
  });
  return { toplam, odenen, bekleyen, gecikmis, senetler };
}

// ============================================================
// KATEGORİ ETİKETLERİ
// ============================================================
export const KATEGORI_LABELS = {
  maas: "Maaş",
  kira: "Kira",
  mutfak: "Mutfak",
  reklam: "Reklam",
  fatura: "Fatura (Elektrik/Su/İnternet)",
  senet_tahsilat: "Senet Tahsilatı",
  kayit_ucreti: "Kayıt Ücreti",
  kirtasiye: "Kırtasiye & Malzeme",
  temizlik: "Temizlik",
  bakim: "Bakım-Onarım",
  vergi: "Vergi",
  diger: "Diğer"
};

export const ODEME_SEKLI_LABELS = {
  nakit: "Nakit",
  havale: "Havale/EFT",
  kart: "Kart"
};
