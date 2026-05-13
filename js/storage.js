const STORAGE_KEY = "kalkulator-jual-beli-mama-papua-v1";
const USER_CODE_KEY = "kalkulator-mama-papua-kode-user";
const TRANSACTIONS_KEY = "kalkulator-mama-papua-riwayat-v1";

(function () {
  function readUserCode() {
    return (localStorage.getItem(USER_CODE_KEY) || "").trim().toUpperCase();
  }
  function saveUserCode(code) {
    localStorage.setItem(
      USER_CODE_KEY,
      String(code || "")
        .trim()
        .toUpperCase(),
    );
  }
  function clearUserCode() {
    localStorage.removeItem(USER_CODE_KEY);
  }
  function scopedKey(kodeUser) {
    return `${TRANSACTIONS_KEY}:${(kodeUser || "guest").toUpperCase()}`;
  }
  function getRiwayat(kodeUser) {
    try {
      const raw = localStorage.getItem(scopedKey(kodeUser));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  function setRiwayat(kodeUser, list) {
    localStorage.setItem(
      scopedKey(kodeUser),
      JSON.stringify(Array.isArray(list) ? list : []),
    );
  }
  function readLastCalculation() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (_) {
      return null;
    }
  }
  function saveLastCalculation(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data || null));
  }
  function clearLastCalculation() {
    localStorage.removeItem(STORAGE_KEY);
  }
  function mapRowToApp(row) {
    return {
      id: String(row.id || ""),
      savedAt: new Date().toISOString(),
      namaBarang: row.nama_barang || "",
      jumlahBarang: Number(row.jumlah_barang || 0),
      totalBiayaProduksi: Number(row.total_biaya || 0),
      modalPerBarang: Number(row.modal_barang || 0),
      hargaReguler: Number(row.harga_reguler || 0),
      hargaPremium: Number(row.harga_premium || 0),
      hargaKolektor: Number(row.harga_kolektor || 0),
      kodeUser: row.kode_user || "",
      userId: row.user_id || null,
    };
  }
  async function saveTransaction(data) {
    const kodeUser = readUserCode();
    if (!kodeUser) return { source: "blocked_no_auth" };
    const localItem = {
      id: window.KalkulatorUtils.uid(),
      savedAt: new Date().toISOString(),
      kodeUser,
      namaBarang: data.namaBarang || "Tanpa Nama",
      jumlahBarang: Number(data.jumlahBarang || 0),
      totalBiayaProduksi: Number(data.totalBiayaProduksi || 0),
      modalPerBarang: Number(data.modalPerBarang || 0),
      hargaReguler: Number(data.hargaReguler || 0),
      hargaPremium: Number(data.hargaPremium || 0),
      hargaKolektor: Number(data.hargaKolektor || 0),
    };
    const current = getRiwayat(kodeUser);
    current.unshift(localItem);
    setRiwayat(kodeUser, current);
    const supabase =
      window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    const table =
      (window.KalkulatorSupabase && window.KalkulatorSupabase.table) ||
      "Riwayat";
    if (!navigator.onLine || !supabase)
      return { source: "local_offline", item: localItem };
    const { data: inserted, error } = await supabase
      .from(table)
      .insert([
        {
          kode_user: kodeUser,
          nama_barang: localItem.namaBarang,
          jumlah_barang: localItem.jumlahBarang,
          total_biaya: localItem.totalBiayaProduksi,
          modal_barang: localItem.modalPerBarang,
          harga_reguler: localItem.hargaReguler,
          harga_premium: localItem.hargaPremium,
          harga_kolektor: localItem.hargaKolektor,
        },
      ])
      .select()
      .single();
    if (error)
      return {
        source: "local_fallback",
        item: localItem,
        error: error.message,
      };
    return { source: "supabase", item: localItem, remote: inserted };
  }
  async function loadTransactions() {
    const kodeUser = readUserCode();
    if (!kodeUser) return { source: "no_code", data: [] };
    const local = getRiwayat(kodeUser);
    const supabase =
      window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    const table =
      (window.KalkulatorSupabase && window.KalkulatorSupabase.table) ||
      "Riwayat";
    if (!navigator.onLine || !supabase) return { source: "local", data: local };
    const { data, error } = await supabase
      .from(table)
      .select(
        "id,nama_barang,jumlah_barang,total_biaya,modal_barang,harga_reguler,harga_premium,harga_kolektor,user_id,kode_user",
      )
      .eq("kode_user", kodeUser)
      .order("id", { ascending: false })
      .limit(100);
    if (error)
      return { source: "local_fallback", data: local, error: error.message };
    const mapped = (data || []).map(mapRowToApp);
    setRiwayat(kodeUser, mapped);
    return { source: "supabase", data: mapped };
  }
  async function loadTransactionsHybrid() {
    return loadTransactions();
  }
  async function readLatestTransaction() {
    const kodeUser = readUserCode();
    const all = getRiwayat(kodeUser);
    return all.length ? all[0] : null;
  }
  window.KalkulatorStorage = {
    readUserCode,
    saveUserCode,
    clearUserCode,
    readLastCalculation,
    saveLastCalculation,
    clearLastCalculation,
    loadTransactions,
    loadTransactionsHybrid,
    saveTransaction,
    readLatestTransaction,
  };
})();
