# 📋 GitHub'a Yükleme — Kısa Rehber

**Adresin:** https://tufanutlu0.github.io/kursyonetim/

---

## 1️⃣ Repoyu Oluştur

1. https://github.com/new
2. Repository name: **`kursyonetim`** (aynen böyle, küçük harfle)
3. Public seç → **Create repository**

## 2️⃣ Dosyaları Yükle

Repo açıldıktan sonra gelen sayfada **"uploading an existing file"** linkine tıkla.

⚠️ **ÖNEMLİ:** `kursyonetim` klasörünün **içindeki** dosyaları/klasörleri sürükle — klasörün kendisini değil.

Yüklenecekler:
```
index.html          ← kök dosya
firestore.rules
css/               ← klasör olarak
js/                ← klasör olarak
pages/             ← klasör olarak
docs/              ← klasör olarak (opsiyonel)
```

Commit message yaz: `init: Yıldız Kurs ERP` → **Commit changes**

## 3️⃣ GitHub Pages'i Aç

1. Settings (üstte) → sol menüden **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / folder: **/ (root)** → **Save**

1 dakika bekle, yeşil kutucukta URL'in çıkar.

## 4️⃣ ⚠️ Firebase'e GitHub Domain'ini Ekle (ZORUNLU)

Bu atlanırsa login çalışmaz.

1. https://console.firebase.google.com → **notlarim-5705d** projesini aç
2. Sol menü → **Authentication** → **Settings** sekmesi
3. **Authorized domains** bölümüne in
4. **Add domain** → yaz:
   ```
   tufanutlu0.github.io
   ```
5. **Add**

## 5️⃣ Email/Password Girişini Aç

1. Authentication → **Sign-in method** sekmesi
2. **Email/Password** → Enable → Save

## 6️⃣ Firestore'u Kur

1. Sol menü → **Firestore Database** → **Create database**
2. **Production mode** → Region: `eur3 (europe-west)` → **Enable**
3. **Rules** sekmesine geç
4. `firestore.rules` dosyasının içeriğini tamamen kopyala → Rules editörüne yapıştır → **Publish**

## 7️⃣ İlk Admin Kullanıcını Oluştur

**Adım A:** Authentication → Users → **Add user**
- Email: kendi adresin (örn. `tufan@yildizkurs.com`)
- Password: güçlü bir şifre
- **Add user**

**Adım B:** Oluşan kullanıcıyı tıkla, **User UID**'i kopyala (çok uzun bir string).

**Adım C:** Firestore Database → **Start collection**
- Collection ID: `users` → Next
- Document ID: kopyaladığın **UID**'i buraya yapıştır
- Alanları ekle:

| Field | Type | Value |
|-------|------|-------|
| uid | string | (UID'i tekrar yapıştır) |
| email | string | tufan@yildizkurs.com |
| displayName | string | Tufan |
| role | string | **admin** |
| phone | string | 05XX... |
| active | boolean | **true** |
| linkedId | string | (boş bırak) |

**Save**

## 8️⃣ Test Et 🎉

https://tufanutlu0.github.io/kursyonetim/

- Login ekranı açılmalı
- Email + şifrenle giriş yap
- Dashboard'a düşmelisin

---

## 🔁 Sonradan Güncelleme Yapmak İçin

Repo sayfasında → dosyaya tıkla → kalem simgesi (✏️) → düzenle → commit.

Veya Git ile:
```bash
git clone https://github.com/tufanutlu0/kursyonetim.git
cd kursyonetim
# dosyaları değiştir
git add .
git commit -m "update: ..."
git push
```

30-60 saniye içinde GitHub Pages otomatik günceller.

---

## ❓ Hata Alırsan

| Hata | Çözüm |
|------|-------|
| `auth/unauthorized-domain` | Adım 4'ü yap |
| Beyaz ekran / Permissions hatası | Adım 6 (rules) ve 7 (users dokümanı) kontrol |
| Login sonra tekrar login | `users/{uid}` dokümanında `role: "admin"` ve `active: true` olduğundan emin ol |
| 404 | 1 dk bekle; Settings → Pages'de URL göründüğünden emin ol |
