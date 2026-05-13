const STORAGE_KEY = "kalkulator-jual-beli-mama-papua-v1";
const SETTINGS_KEY = "kalkulator-mama-papua-settings-v1";
const TRANSACTIONS_KEY = "kalkulator-mama-papua-transaksi-v1";

if (!STORAGE_KEY) {
  console.error("STORAGE_KEY belum dibuat");
}

(function () {
  function readLastCalculation() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Gagal membaca data kalkulator:", error);
      return null;
    }
  }

  function saveLastCalculation(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || null));
  }

  function clearLastCalculation() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch (error) {
      console.error("Gagal membaca pengaturan:", error);
      return {};
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings || {}));
  }

  function readTransactions() {
    try {
      const raw = localStorage.getItem(TRANSACTIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Gagal membaca transaksi:", error);
      return [];
    }
  }

  function saveTransactions(list) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  }

  function saveTransaction(data) {
    const current = readTransactions();
    const item = {
      id: (window.KalkulatorUtils && KalkulatorUtils.uid ? KalkulatorUtils.uid() : `tx-${Date.now()}`),
      savedAt: new Date().toISOString(),
      ...data,
    };
    current.unshift(item);
    saveTransactions(current);
    return item;
  }

  function updateTransaction(id, patch) {
    const current = readTransactions();
    const next = current.map(function (item) {
      if (item.id !== id) return item;
      return { ...item, ...patch, updatedAt: new Date().toISOString() };
    });
    saveTransactions(next);
    return next.find(function (item) { return item.id === id; }) || null;
  }

  function deleteTransaction(id) {
    const current = readTransactions();
    const next = current.filter(function (item) { return item.id !== id; });
    saveTransactions(next);
    return next;
  }

  function readLatestTransaction() {
    const current = readTransactions();
    return current.length ? current[0] : null;
  }

  window.KalkulatorStorage = {
    readLastCalculation,
    saveLastCalculation,
    clearLastCalculation,
    readSettings,
    saveSettings,
    readTransactions,
    saveTransaction,
    updateTransaction,
    deleteTransaction,
    readLatestTransaction,
  };
})();
