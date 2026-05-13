const STORAGE_KEY = "kalkulator-jual-beli-mama-papua-v1";
const TRANSACTIONS_KEY = "kalkulator-mama-papua-riwayat-v1";

(function () {
  function getRiwayat() {
    try {
      const raw = localStorage.getItem(TRANSACTIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Gagal membaca riwayat lokal:", error);
      return [];
    }
  }

  function setRiwayat(list) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  }

  function readLastCalculation() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Gagal membaca kalkulasi terakhir:", error);
      return null;
    }
  }

  function saveLastCalculation(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || null));
    } catch (error) {
      console.error("Gagal menyimpan kalkulasi terakhir:", error);
    }
  }

  function clearLastCalculation() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function mapRowToApp(row) {
    const hargaReguler = Number(row.harga_reguler || 0);
    return {
      id: String(row.id || ""),
      savedAt: new Date().toISOString(),
      namaBarang: row.nama_barang || "",
      jumlahBarang: Number(row.jumlah_barang || 0),
      totalBiayaProduksi: Number(row.total_biaya || 0),
      modalPerBarang: Number(row.modal_barang || 0),
      hargaReguler,
      hargaPremium: Number(row.harga_premium || 0),
      hargaKolektor: Number(row.harga_kolektor || 0),
    };
  }

  async function saveTransaction(data) {
    const localItem = {
      id: window.KalkulatorUtils && KalkulatorUtils.uid ? KalkulatorUtils.uid() : `tx-${Date.now()}`,
      savedAt: new Date().toISOString(),
      namaBarang: data.namaBarang || "Tanpa Nama",
      jumlahBarang: Number(data.jumlahBarang || 0),
      totalBiayaProduksi: Number(data.totalBiayaProduksi || 0),
      modalPerBarang: Number(data.modalPerBarang || 0),
      hargaReguler: Number(data.hargaReguler || 0),
      hargaPremium: Number(data.hargaPremium || 0),
      hargaKolektor: Number(data.hargaKolektor || 0),
    };

    const current = getRiwayat();
    current.unshift(localItem);
    setRiwayat(current);

    const supabase = window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    const table = (window.KalkulatorSupabase && window.KalkulatorSupabase.table) || "Riwayat";

    if (!navigator.onLine || !supabase) {
      return { source: "local_offline", item: localItem };
    }

    const payload = {
      nama_barang: localItem.namaBarang,
      jumlah_barang: localItem.jumlahBarang,
      total_biaya: localItem.totalBiayaProduksi,
      modal_barang: localItem.modalPerBarang,
      harga_reguler: localItem.hargaReguler,
      harga_premium: localItem.hargaPremium,
      harga_kolektor: localItem.hargaKolektor,
    };

    const { data: inserted, error } = await supabase.from(table).insert([payload]).select().single();
    if (error) {
      console.error("Simpan Supabase gagal:", error);
      return { source: "local_fallback", item: localItem, error: error.message };
    }

    return { source: "supabase", item: localItem, remote: inserted };
  }

  async function loadTransactions() {
    const local = getRiwayat();
    const supabase = window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    const table = (window.KalkulatorSupabase && window.KalkulatorSupabase.table) || "Riwayat";

    if (!navigator.onLine || !supabase) {
      return { source: "local", data: local };
    }

    const { data, error } = await supabase
      .from(table)
      .select("id,nama_barang,jumlah_barang,total_biaya,modal_barang,harga_reguler,harga_premium,harga_kolektor")
      .order("id", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Load Supabase gagal, fallback local:", error);
      return { source: "local_fallback", data: local, error: error.message };
    }

    const mapped = (data || []).map(mapRowToApp);
    setRiwayat(mapped);
    return { source: "supabase", data: mapped };
  }

  async function loadTransactionsHybrid() {
    return loadTransactions();
  }

  function readLatestTransaction() {
    const all = getRiwayat();
    return all.length ? all[0] : null;
  }

  window.KalkulatorStorage = {
    readLastCalculation,
    saveLastCalculation,
    clearLastCalculation,
    loadTransactions,
    loadTransactionsHybrid,
    saveTransaction,
    readLatestTransaction,
  };
})();
