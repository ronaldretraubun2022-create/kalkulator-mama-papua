(function () {
  const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

  function parseAngka(value) {
    return Number(String(value || "").replace(/\D/g, "")) || 0;
  }

  function formatRupiah(value) {
    return rupiahFormatter.format(Math.max(0, Math.round(Number(value) || 0)));
  }

  function formatAngka(value) {
    const angka = String(value || "").replace(/\D/g, "");
    if (!angka) return "";
    return angka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthKey(dateValue) {
    return String(dateValue || todayISO()).slice(0, 7);
  }

  function dayLabel(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  }

  function monthLabel(monthValue) {
    return new Date(`${monthValue}-01T00:00:00`).toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  }

  function safeText(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[char];
    });
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove("hidden");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.add("hidden");
    }, 2200);
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  window.KalkulatorUtils = {
    parseAngka,
    formatRupiah,
    formatAngka,
    todayISO,
    monthKey,
    dayLabel,
    monthLabel,
    safeText,
    showToast,
    uid,
  };
})();
