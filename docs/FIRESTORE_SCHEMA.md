# 🏛️ Yıldız Kurs ERP — Firestore Şema Tasarımı

## Genel Prensipler
- **Flat yapı** (subcollection'lar sadece gerçekten gerektiğinde)
- Her dökümana `createdAt`, `updatedAt`, `createdBy` (uid) ekle
- Para birimleri `Number` (kuruş değil, TL — `1250.50`)
- Tarihler `Timestamp` (Firestore native)

---

## 📁 Koleksiyonlar

### 1. `users` — Sistem Kullanıcıları (Auth ile eşleşir)
**Doküman ID:** `auth.uid`

```js
{
  uid: "string",           // Firebase Auth UID
  email: "string",
  displayName: "string",
  role: "admin" | "mudur" | "ogretmen" | "veli",
  phone: "string",
  active: true,
  linkedId: "string",      // Rol'e göre bağlı doküman ID'si:
                           // - ogretmen -> teachers/{id}
                           // - veli     -> students/{id}  (velinin öğrencisi)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Roller:**
| Rol | Erişim |
|------|--------|
| `admin` | Her şeye tam erişim (Yönetici) |
| `mudur` | Muhasebe/Kasa hariç her şey |
| `ogretmen` | Sadece kendi sınıfları + yoklama |
| `veli` | Sadece kendi öğrencisinin senet/hesap ekstresi |

---

### 2. `students` — Öğrenciler
```js
{
  id: "auto",
  adSoyad: "string",
  tcNo: "string",
  telefon: "string",
  okul: "string",
  sinif: "string",           // Okuldaki sınıfı (8-A vb.)
  kursSinifId: "ref",        // classes koleksiyonuna ref
  dogumTarihi: Timestamp,
  dogumYeri: "string",
  adres: "string",
  kayitTarihi: Timestamp,
  aktif: true,

  // Veli bilgileri (embedded — hızlı erişim)
  anne: {
    adSoyad: "string",
    tcNo: "string",
    telefon: "string",
    meslek: "string",
    isyeri: "string",
    email: "string"
  },
  baba: {
    adSoyad: "string",
    tcNo: "string",
    telefon: "string",
    meslek: "string",
    isyeri: "string",
    email: "string"
  },

  // Veli login için (opsiyonel — veli hesabı açıldıysa)
  veliAuthUid: "string|null",
  senetSorumlusu: "anne" | "baba",

  notlar: "string",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "uid"
}
```

---

### 3. `teachers` — Öğretmenler
```js
{
  id: "auto",
  adSoyad: "string",
  tcNo: "string",
  telefon: "string",
  email: "string",
  brans: "string",           // Matematik, Fizik, Türkçe...
  adres: "string",
  iseBaslama: Timestamp,
  aylikMaas: Number,
  aktif: true,
  authUid: "string|null",    // Öğretmen login'i varsa
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Subcollection:** `teachers/{id}/salaryPayments`
```js
{
  donem: "2026-04",          // Yıl-Ay
  tutar: Number,
  odemeTarihi: Timestamp,
  odemeSekli: "nakit" | "havale" | "kart",
  aciklama: "string",
  kasaHareketId: "ref"       // cashFlow koleksiyonuna
}
```

---

### 4. `classes` — Sınıflar
```js
{
  id: "auto",
  ad: "string",              // "LGS-A Sınıfı"
  seviye: "LGS" | "YKS" | "8.Sınıf" | ...
  ogretmenId: "ref",         // teachers/{id}
  ogretmenAdi: "string",     // Denormalize
  ogrenciIds: ["ref", ...],  // students array
  kapasite: 20,
  donem: "2025-2026",
  aktif: true,
  createdAt: Timestamp
}
```

**Subcollection:** `classes/{id}/attendance`
```js
{
  tarih: Timestamp,
  ogretmenId: "ref",
  ogrenciler: {
    "studentId1": "var" | "yok" | "gec" | "izinli",
    "studentId2": "var",
    ...
  },
  not: "string",
  createdAt: Timestamp
}
```

---

### 5. `promissoryNotes` — Senetler (Taksitler)
```js
{
  id: "auto",
  studentId: "ref",
  studentAdi: "string",      // Denormalize
  veliTipi: "anne" | "baba",
  veliAdi: "string",
  veliTcNo: "string",

  toplamTutar: Number,
  taksitSayisi: Number,
  taksitNo: 1,               // Bu senet kaçıncı taksit
  taksitTutari: Number,

  vadeTarihi: Timestamp,
  durum: "bekliyor" | "odendi" | "gecikti" | "iptal",

  odemeTarihi: Timestamp|null,
  odemeSekli: "nakit" | "havale" | "kart" | null,
  tahsilatMakbuzNo: "string|null",

  taksitGrupId: "string",    // Aynı anda oluşan taksitler için UUID
  aciklama: "string",
  kasaHareketId: "ref|null", // Ödendiğinde cashFlow'a bağlanır

  createdAt: Timestamp,
  createdBy: "uid"
}
```

---

### 6. `cashFlow` — Günlük Kasa (Gelir/Gider)
```js
{
  id: "auto",
  tarih: Timestamp,
  tip: "gelir" | "gider",
  kategori: "maas" | "kira" | "mutfak" | "reklam" | "fatura" |
            "senet_tahsilat" | "kayit_ucreti" | "diger",
  tutar: Number,
  aciklama: "string",
  odemeSekli: "nakit" | "havale" | "kart",

  // İlişkili kayıt (varsa)
  iliskiliTip: "senet" | "maas" | null,
  iliskiliId: "ref|null",

  createdAt: Timestamp,
  createdBy: "uid"
}
```

---

### 7. `contracts` — Sözleşmeler (Öğrenci/Öğretmen)
```js
{
  id: "auto",
  tip: "ogrenci" | "ogretmen",
  hedefId: "ref",            // student veya teacher id
  hedefAdi: "string",
  sablon: "standart" | "ozel",
  icerikHtml: "string",      // Render edilmiş sözleşme HTML
  tutar: Number,
  baslangicTarihi: Timestamp,
  bitisTarihi: Timestamp,
  imzalandi: false,
  imzaTarihi: Timestamp|null,
  createdAt: Timestamp,
  createdBy: "uid"
}
```

---

### 8. `settings` — Sistem Ayarları (tek doküman: `app`)
```js
{
  kurumAdi: "Yıldız Kurs",
  kurumAdresi: "...",
  kurumTelefon: "...",
  kurumVergiNo: "...",
  logoUrl: "...",
  tahsilatMakbuzSonNo: 1247,
  updatedAt: Timestamp
}
```

---

## 🔐 Güvenlik Kuralları Özeti

| Koleksiyon | admin | mudur | ogretmen | veli |
|-----------|:-----:|:-----:|:--------:|:----:|
| users | RW | R (kendi) | R (kendi) | R (kendi) |
| students | RW | RW | R (sınıfındaki) | R (kendi öğrencisi) |
| teachers | RW | R | R (kendi) | ❌ |
| classes | RW | RW | R (kendi sınıfları) | ❌ |
| attendance | RW | R | RW (kendi sınıfı) | ❌ |
| promissoryNotes | RW | RW | ❌ | R (kendi öğrencisi) |
| cashFlow | RW | ❌ | ❌ | ❌ |
| salaryPayments | RW | ❌ | R (kendi) | ❌ |
| contracts | RW | RW | R (kendi) | R (kendi öğrencisi) |
| settings | RW | R | R | R |

---

## 🎯 İndeksler (gerekli olanlar)

```
promissoryNotes: [studentId ASC, vadeTarihi ASC]
promissoryNotes: [durum ASC, vadeTarihi ASC]
cashFlow: [tarih DESC, tip ASC]
attendance: [classId ASC, tarih DESC]
students: [kursSinifId ASC, aktif ASC]
```
