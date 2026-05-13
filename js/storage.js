const STORAGE_KEY = "kalkulator-jual-beli-mama-papua-v1";
const SETTINGS_KEY = "kalkulator-mama-papua-settings-v1";

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

  window.KalkulatorStorage = {
    readLastCalculation,
    saveLastCalculation,
    clearLastCalculation,
    readSettings,
    saveSettings,
  };
})();
