// ============================================================
// Auth Guard — Rol tabanlı erişim kontrolü
// ============================================================
import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Rol -> Yönlendirme haritası
const ROLE_HOME = {
  admin: "/pages/admin.html",
  mudur: "/pages/admin.html",       // Aynı panel, muhasebe gizli
  ogretmen: "/pages/ogretmen.html",
  veli: "/pages/veli.html"
};

// Sayfa -> İzin verilen roller
const PAGE_ROLES = {
  "admin.html":    ["admin", "mudur"],
  "ogretmen.html": ["ogretmen"],
  "veli.html":     ["veli"],
  "login.html":    ["*"] // herkese açık
};

/**
 * Mevcut sayfa için kullanıcı yetkisini kontrol eder.
 * Yetkisizse yönlendirir. Yetkiliyse user+profile nesnesini döner.
 */
export async function requireAuth(allowedRoles = null) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      const currentPage = window.location.pathname.split("/").pop();

      // Login sayfasındaysa ve user varsa -> kendi paneline gönder
      if (currentPage === "login.html") {
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile) window.location.href = ROLE_HOME[profile.role] || "/pages/login.html";
        }
        resolve({ user: null, profile: null });
        return;
      }

      // Diğer sayfalar için login zorunlu
      if (!user) {
        window.location.href = "/pages/login.html";
        return;
      }

      const profile = await getUserProfile(user.uid);

      if (!profile || !profile.active) {
        alert("Hesabınız aktif değil. Yönetici ile iletişime geçin.");
        await signOut(auth);
        window.location.href = "/pages/login.html";
        return;
      }

      // Rol kontrolü
      const permitted = allowedRoles || PAGE_ROLES[currentPage] || [];
      if (permitted.length && !permitted.includes(profile.role) && !permitted.includes("*")) {
        // Yetkisiz -> kendi home'una
        window.location.href = ROLE_HOME[profile.role] || "/pages/login.html";
        return;
      }

      resolve({ user, profile });
    });
  });
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/pages/login.html";
}

// Helper: rol bazlı UI gizleme
// HTML'de: <div data-role="admin">...</div>
// Birden fazla rol: data-role="admin,mudur"
// Gizlenecek rol: data-hide-role="mudur"
export function applyRoleUI(profile) {
  document.querySelectorAll("[data-role]").forEach(el => {
    const roles = el.dataset.role.split(",").map(r => r.trim());
    if (!roles.includes(profile.role)) el.style.display = "none";
  });
  document.querySelectorAll("[data-hide-role]").forEach(el => {
    const roles = el.dataset.hideRole.split(",").map(r => r.trim());
    if (roles.includes(profile.role)) el.style.display = "none";
  });

  // User bilgilerini sayfada bas
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = profile.displayName || profile.email);
  document.querySelectorAll("[data-user-role]").forEach(el => el.textContent = roleLabel(profile.role));
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = profile.email);
}

export function roleLabel(role) {
  return { admin: "Yönetici", mudur: "Müdür", ogretmen: "Öğretmen", veli: "Veli" }[role] || role;
}

// Logout butonları otomatik bağla
export function bindLogoutButtons() {
  document.querySelectorAll("[data-action='logout']").forEach(btn => {
    btn.addEventListener("click", (e) => { e.preventDefault(); logout(); });
  });
}
