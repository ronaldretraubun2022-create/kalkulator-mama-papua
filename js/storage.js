const STORAGE_KEY = "kalkulator-jual-beli-mama-papua-v1";
const TRANSACTIONS_KEY = "kalkulator-mama-papua-transaksi-v1";

const KalkulatorStorage = {
  getRiwayat() {
    try {
      return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY)) || [];
    } catch (error) {
      console.error("Gagal membaca transaksi:", error);
      return [];
    }
  },

  setRiwayat(data) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data || []));
  },

  readLastCalculation() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch (error) {
      console.error("Gagal membaca kalkulasi terakhir:", error);
      return null;
    }
  },

  saveLastCalculation(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Gagal menyimpan kalkulasi terakhir:", error);
    }
  },

  async saveTransaction(data) {
    const localData = this.getRiwayat();

    const payload = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      namaBarang: data.namaBarang || data.nama_barang || "Tanpa Nama",
      jumlahBarang: Number(data.jumlahBarang || data.jumlah_barang || 0),
      totalBiayaProduksi: Number(
        data.totalBiayaProduksi || data.total_biaya || 0,
      ),
      modalPerBarang: Number(data.modalPerBarang || data.modal_barang || 0),
      hargaReguler: Number(data.hargaReguler || data.harga_reguler || 0),
    };

    localData.unshift(payload);
    this.setRiwayat(localData);

    const supabase = window.KalkulatorSupabase?.client;
    const table = window.KalkulatorSupabase?.table || "Riwayat";

    if (!supabase || !navigator.onLine) {
      return payload;
    }

    const { error } = await supabase.from(table).insert([
      {
        nama_barang: payload.namaBarang,
        jumlah_barang: payload.jumlahBarang,
        total_biaya: payload.totalBiayaProduksi,
        modal_barang: payload.modalPerBarang,
        harga_reguler: payload.hargaReguler,
      },
    ]);

    if (error) {
      console.error("Simpan Supabase gagal:", error);
    }

    return payload;
  },

  async loadTransactions() {
    const supabase = window.KalkulatorSupabase?.client;
    const table = window.KalkulatorSupabase?.table || "Riwayat";

    if (!supabase || !navigator.onLine) {
      return this.getRiwayat();
    }

    const { data, error } = await supabase
      .from(table)
      .select(
        "id,nama_barang,jumlah_barang,total_biaya,modal_barang,harga_reguler",
      )
      .order("id", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Load Supabase gagal, fallback local:", error);
      return this.getRiwayat();
    }

    const mapped = (data || []).map((row) => ({
      id: row.id,
      savedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      namaBarang: row.nama_barang,
      jumlahBarang: Number(row.jumlah_barang || 0),
      totalBiayaProduksi: Number(row.total_biaya || 0),
      modalPerBarang: Number(row.modal_barang || 0),
      hargaReguler: Number(row.harga_reguler || 0),
    }));

    this.setRiwayat(mapped);
    return mapped;
  },

  async loadTransactionsHybrid() {
    return this.loadTransactions();
  },

  clearRiwayat() {
    localStorage.removeItem(TRANSACTIONS_KEY);
  },
};

window.KalkulatorStorage = KalkulatorStorage;
