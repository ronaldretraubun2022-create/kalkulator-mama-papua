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

  async function saveTransactionRemote(data) {
    const client = window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    const table = (window.KalkulatorSupabase && window.KalkulatorSupabase.table) || "transaksi";
    if (!client) return { ok: false, reason: "supabase_not_configured" };
    const payload = {
      nama_barang: data.namaBarang || "",
      modal: Number(data.modalPerBarang || 0),
      jual: Number(data.hargaReguler || 0),
      keuntungan: Number((data.hargaReguler || 0) - (data.modalPerBarang || 0)),
    };
    const response = await client.from(table).insert(payload).select().single();
    if (response.error) {
      throw response.error;
    }
    return { ok: true, row: response.data };
  }

  async function saveTransactionHybrid(data) {
    const localItem = saveTransaction(data);
    if (!navigator.onLine) return { source: "local_offline", item: localItem };
    try {
      const remote = await saveTransactionRemote(data);
      if (remote.ok) return { source: "supabase", item: localItem, remote: remote.row };
      return { source: "local_only", item: localItem };
    } catch (error) {
      console.error("Simpan Supabase gagal, fallback local:", error);
      return { source: "local_fallback", item: localItem, error: String(error && error.message ? error.message : error) };
    }
  }

  async function loadTransactionsHybrid() {
    const local = readTransactions();
    const client = window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    const table = (window.KalkulatorSupabase && window.KalkulatorSupabase.table) || "transaksi";
    if (!navigator.onLine || !client) return { source: "local", data: local };

    try {
      const response = await client
        .from(table)
        .select("id,created_at,nama_barang,modal,jual,keuntungan")
        .order("created_at", { ascending: false })
        .limit(100);
      if (response.error) throw response.error;

      const mapped = (response.data || []).map(function (row) {
        const modal = Number(row.modal || 0);
        const hargaReguler = Number(row.jual || 0);
        const keuntungan = Number(row.keuntungan || (hargaReguler - modal));
        return {
          id: String(row.id),
          savedAt: row.created_at,
          createdAt: row.created_at,
          namaBarang: row.nama_barang || "",
          modalPerBarang: modal,
          hargaReguler: hargaReguler,
          marginNominal: keuntungan,
          hargaPremium: hargaReguler,
          hargaKolektor: hargaReguler,
          totalBiayaProduksi: modal,
        };
      });
      if (mapped.length) saveTransactions(mapped);
      return { source: "supabase", data: mapped.length ? mapped : local };
    } catch (error) {
      console.error("Load Supabase gagal, fallback local:", error);
      return { source: "local_fallback", data: local, error: String(error && error.message ? error.message : error) };
    }
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
    saveTransactionHybrid,
    loadTransactionsHybrid,
    updateTransaction,
    deleteTransaction,
    readLatestTransaction,
  };
})();
