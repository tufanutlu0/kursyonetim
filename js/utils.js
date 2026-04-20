// ============================================================
// Utility Helpers — Yıldız Kurs ERP
// ============================================================

// ---- Currency / Date Formatting ----
export const TL = (n) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n || 0);
export const NUM = (n) => new Intl.NumberFormat("tr-TR").format(n || 0);

export const fmtDate = (d) => {
  if (!d) return "—";
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
};
export const fmtDateLong = (d) => {
  if (!d) return "—";
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
};
export const fmtDateTime = (d) => {
  if (!d) return "—";
  const date = d.toDate ? d.toDate() : new Date(d);
  return date.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
};

// ---- Toast Notifications ----
export function toast(message, type = "info", duration = 3000) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-8px)";
    el.style.transition = "all 0.3s";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ---- Confirm Modal (Apple-style) ----
export function confirmDialog(title, message, confirmText = "Evet", cancelText = "Vazgeç", danger = false) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <h3 class="t-head" style="margin:0">${title}</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--ink-2);margin:0">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-act="cancel">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.querySelector("[data-act='ok']").onclick = () => { backdrop.remove(); resolve(true); };
    backdrop.querySelector("[data-act='cancel']").onclick = () => { backdrop.remove(); resolve(false); };
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
  });
}

// ---- Modal helper ----
export function openModal(innerHtml, { maxWidth = 560 } = {}) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<div class="modal" style="max-width:${maxWidth}px">${innerHtml}</div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
  backdrop.close = () => backdrop.remove();
  return backdrop;
}

// ---- TC Kimlik doğrulama ----
export function tcKimlikValid(tc) {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false;
  const d = tc.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if (((odd * 7) - even) % 10 !== d[9]) return false;
  if ((d.slice(0, 10).reduce((a, b) => a + b)) % 10 !== d[10]) return false;
  return true;
}

// ---- Telefon formatı ----
export const fmtPhone = (p) => {
  if (!p) return "—";
  const x = String(p).replace(/\D/g, "");
  if (x.length === 10) return `0 (${x.slice(0,3)}) ${x.slice(3,6)} ${x.slice(6,8)} ${x.slice(8)}`;
  if (x.length === 11) return `${x[0]} (${x.slice(1,4)}) ${x.slice(4,7)} ${x.slice(7,9)} ${x.slice(9)}`;
  return p;
};

// ---- Senet durumu renk sınıfı ----
export function senetStatus(senet) {
  if (senet.durum === "odendi") return { cls: "row-paid", badge: "badge-success", label: "Ödendi" };
  if (senet.durum === "iptal") return { cls: "", badge: "badge-neutral", label: "İptal" };
  const vade = senet.vadeTarihi?.toDate ? senet.vadeTarihi.toDate() : new Date(senet.vadeTarihi);
  const today = new Date(); today.setHours(0,0,0,0);
  if (vade < today) return { cls: "row-overdue", badge: "badge-danger", label: "Gecikmiş" };
  return { cls: "row-pending", badge: "badge-warning", label: "Bekliyor" };
}

// ---- Query string helper ----
export const qs = (key) => new URLSearchParams(window.location.search).get(key);

// ---- Loading state ----
export function setLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite"></span>`;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || "Tamam";
  }
}

// Spin animation injection
if (!document.getElementById("yk-spin-style")) {
  const s = document.createElement("style");
  s.id = "yk-spin-style";
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}
