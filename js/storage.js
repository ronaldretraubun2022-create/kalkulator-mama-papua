const STORAGE_KEY = "kalkulator-jual-beli-mama-papua-v1";
const TRANSACTIONS_KEY = "kalkulator-mama-papua-riwayat-v1";

(function () {
  function userScopedKey(userId) {
    return `${TRANSACTIONS_KEY}:${userId || "guest"}`;
  }

  function getRiwayat(userId) {
    try {
      const raw = localStorage.getItem(userScopedKey(userId));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Gagal membaca riwayat lokal:", error);
      return [];
    }
  }

  function setRiwayat(userId, list) {
    localStorage.setItem(
      userScopedKey(userId),
      JSON.stringify(Array.isArray(list) ? list : []),
    );
  }

  function readLastCalculation() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
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
      userId: row.user_id || null,
    };
  }

  async function saveTransaction(data) {
    const session = await window.KalkulatorSupabase.getSession();
    if (!session || !session.user) return { source: "blocked_no_auth" };
    const userId = session.user.id;

    const localItem = {
      id: window.KalkulatorUtils.uid(),
      savedAt: new Date().toISOString(),
      namaBarang: data.namaBarang || "Tanpa Nama",
      jumlahBarang: Number(data.jumlahBarang || 0),
      totalBiayaProduksi: Number(data.totalBiayaProduksi || 0),
      modalPerBarang: Number(data.modalPerBarang || 0),
      hargaReguler: Number(data.hargaReguler || 0),
      hargaPremium: Number(data.hargaPremium || 0),
      hargaKolektor: Number(data.hargaKolektor || 0),
      userId,
    };

    const current = getRiwayat(userId);
    current.unshift(localItem);
    setRiwayat(userId, current);

    const supabase = window.KalkulatorSupabase.client;
    const table = window.KalkulatorSupabase.table || "Riwayat";
    if (!navigator.onLine || !supabase)
      return { source: "local_offline", item: localItem };

    const { error, data: inserted } = await supabase
      .from(table)
      .insert([
        {
          user_id: userId,
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
    const session = await window.KalkulatorSupabase.getSession();
    if (!session || !session.user) return { source: "no_auth", data: [] };
    const userId = session.user.id;
    const local = getRiwayat(userId);
    const supabase = window.KalkulatorSupabase.client;
    const table = window.KalkulatorSupabase.table || "Riwayat";

    if (!navigator.onLine || !supabase) return { source: "local", data: local };

    const { data, error } = await supabase
      .from(table)
      .select(
        "id,user_id,nama_barang,jumlah_barang,total_biaya,modal_barang,harga_reguler,harga_premium,harga_kolektor",
      )
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(100);
    if (error)
      return { source: "local_fallback", data: local, error: error.message };
    const mapped = (data || []).map(mapRowToApp);
    setRiwayat(userId, mapped);
    return { source: "supabase", data: mapped };
  }

  async function loadTransactionsHybrid() {
    return loadTransactions();
  }

  async function readLatestTransaction() {
    const session = await window.KalkulatorSupabase.getSession();
    const userId = session && session.user ? session.user.id : null;
    const all = getRiwayat(userId);
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
