# 🚀 Yıldız Kurs ERP — Kurulum Rehberi

## 📦 Proje Yapısı

```
yildiz-erp/
├── css/
│   └── app.css                  ← Apple-style design system
├── js/
│   ├── firebase-config.js       ← Firebase init
│   ├── auth-guard.js            ← Rol kontrolü & yönlendirme
│   └── utils.js                 ← Yardımcı fonksiyonlar
├── pages/
│   ├── login.html               ← Giriş ekranı
│   ├── admin.html               ← Yönetici/Müdür paneli
│   ├── ogretmen.html            ← (Faz 2)
│   └── veli.html                ← (Faz 2)
├── docs/
│   └── FIRESTORE_SCHEMA.md      ← Veritabanı şeması
├── firestore.rules              ← Güvenlik kuralları
└── firebase.json                ← Deploy config
```

## ⚙️ Firebase Console Ayarları

### 1. Authentication'ı Aktifleştir
Firebase Console → **Authentication** → **Sign-in method** → **Email/Password** → Enable

### 2. Firestore Database Oluştur
Firebase Console → **Firestore Database** → **Create database** → **production mode** seç → Region: `eur3` (europe-west)

### 3. Güvenlik Kurallarını Yükle
Firestore → **Rules** sekmesi → `firestore.rules` içeriğini yapıştır → **Publish**

### 4. İlk Admin Kullanıcısını Oluştur

**Adım 1:** Authentication → Users → **Add user**
- Email: `admin@yildizkurs.com` (istediğin email)
- Password: güçlü bir şifre

**Adım 2:** Oluşan kullanıcının **UID**'sini kopyala.

**Adım 3:** Firestore Database → `users` koleksiyonu oluştur → **doküman ID = kopyaladığın UID** ile yeni doküman:

```json
{
  "uid": "[UID]",
  "email": "admin@yildizkurs.com",
  "displayName": "Tufan",
  "role": "admin",
  "phone": "05XX XXX XX XX",
  "active": true,
  "linkedId": null,
  "createdAt": [server timestamp],
  "updatedAt": [server timestamp]
}
```

> ⚠️ **`role` alanı mutlaka `admin` olmalı.** Bu ilk kullanıcı sistemdeki diğer kullanıcıları oluşturacak.

### 5. Firestore İndekslerini Oluştur
İlk sorgular çalıştığında Console'da otomatik "create index" linki çıkar, tıklayıp yarat. Ya da `firebase deploy --only firestore:indexes` kullan.

## 🏃 Çalıştırma

### Yerelde Test
```bash
# Projenin kök dizininde
npx serve .
# veya
python3 -m http.server 8080
```

Tarayıcıda `http://localhost:8080/pages/login.html` adresini aç.

### GitHub Pages'e Deploy
```bash
git init
git remote add origin https://github.com/[kullanici]/yildiz-erp.git
git add .
git commit -m "init: yıldız kurs ERP"
git push -u origin main
```
GitHub → Repo → Settings → Pages → Source: `main` branch → root.

### Firebase Hosting'e Deploy (Önerilen)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting    # public directory: . (mevcut klasör)
firebase deploy
```

## 👥 Kullanıcı Ekleme (Admin Paneli Hazır Olmadan)

İkinci bir kullanıcı eklemek istediğinde (örn. bir öğretmen):

1. Authentication → Add user (email + şifre)
2. Firestore → `users/[yeni UID]` dokümanı oluştur:

```json
{
  "uid": "[UID]",
  "email": "ogretmen@yildizkurs.com",
  "displayName": "Ahmet Yılmaz",
  "role": "ogretmen",
  "phone": "...",
  "active": true,
  "linkedId": "[teachers koleksiyonundaki ID]"
}
```

> `linkedId`:
> - `ogretmen` → `teachers/{id}`
> - `veli` → `students/{id}`
> - `admin`/`mudur` → `null`

## 🔐 Rol Matrisi

| Rol | Dashboard | Öğrenci | Öğretmen | Sınıf | Senet | Kasa | Rapor |
|-----|:---------:|:-------:|:--------:|:-----:|:-----:|:----:|:-----:|
| Yönetici | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Müdür | ✅ | ✅ | 👁 | ✅ | ✅ | ❌ | ❌ |
| Öğretmen | – | – | 👁 (kendi) | 👁 (kendi) | – | ❌ | – |
| Veli | – | 👁 (kendi çocuk) | – | – | 👁 (kendi) | ❌ | – |

## 🎯 Sonraki Adımlar (Faz 2-3-4)

- **Faz 2:** Öğrenci CRUD + veli yapısı (`ogrenciler.html`, `ogrenci-detay.html`)
- **Faz 3:** Senet otomasyonu + Kasa muhasebe (`senetler.html`, `kasa.html`)
- **Faz 4:** Sözleşme print sistemi + Yoklama + Raporlar
