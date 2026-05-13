(function () {
  let rows = [];

  function el(id) {
    return document.getElementById(id);
  }

  function toRp(value) {
    return (window.KalkulatorUtils && KalkulatorUtils.formatRupiah)
      ? KalkulatorUtils.formatRupiah(value)
      : `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
  }

  function renderStats(data) {
    const totalTransaksi = data.length;
    const userUnik = new Set(data.map(function (r) { return (r.kode_user || "").toUpperCase(); }).filter(Boolean)).size;
    const sumBiaya = data.reduce(function (a, r) { return a + Number(r.total_biaya || 0); }, 0);
    const sumReguler = data.reduce(function (a, r) { return a + Number(r.harga_reguler || 0); }, 0);
    const sumPremium = data.reduce(function (a, r) { return a + Number(r.harga_premium || 0); }, 0);
    const sumKolektor = data.reduce(function (a, r) { return a + Number(r.harga_kolektor || 0); }, 0);

    el("totalTransaksi").textContent = String(totalTransaksi);
    el("totalUser").textContent = String(userUnik);
    el("sumBiaya").textContent = toRp(sumBiaya);
    el("sumReguler").textContent = toRp(sumReguler);
    el("sumPremium").textContent = toRp(sumPremium);
    el("sumKolektor").textContent = toRp(sumKolektor);
  }

  function renderTable(data) {
    const body = el("adminRows");
    body.innerHTML = data.map(function (r) {
      return `<tr class="border-t border-[#F2D479]/20">
        <td class="px-3 py-2">${r.kode_user || ""}</td>
        <td class="px-3 py-2">${r.nama_barang || ""}</td>
        <td class="px-3 py-2">${Number(r.jumlah_barang || 0)}</td>
        <td class="px-3 py-2">${toRp(r.total_biaya)}</td>
        <td class="px-3 py-2">${toRp(r.modal_barang)}</td>
        <td class="px-3 py-2">${toRp(r.harga_reguler)}</td>
        <td class="px-3 py-2">${toRp(r.harga_premium)}</td>
        <td class="px-3 py-2">${toRp(r.harga_kolektor)}</td>
      </tr>`;
    }).join("");
  }

  function applyFilter() {
    const kode = (el("filterKode").value || "").trim().toLowerCase();
    const nama = (el("filterNama").value || "").trim().toLowerCase();
    const filtered = rows.filter(function (r) {
      const okKode = !kode || String(r.kode_user || "").toLowerCase().includes(kode);
      const okNama = !nama || String(r.nama_barang || "").toLowerCase().includes(nama);
      return okKode && okNama;
    });
    renderStats(filtered);
    renderTable(filtered);
  }

  function exportCsv() {
    const header = ["kode_user","nama_barang","jumlah_barang","total_biaya","modal_barang","harga_reguler","harga_premium","harga_kolektor"];
    const lines = [header.join(",")].concat(rows.map(function (r) {
      return [
        r.kode_user || "",
        r.nama_barang || "",
        Number(r.jumlah_barang || 0),
        Number(r.total_biaya || 0),
        Number(r.modal_barang || 0),
        Number(r.harga_reguler || 0),
        Number(r.harga_premium || 0),
        Number(r.harga_kolektor || 0),
      ].join(",");
    }));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "riwayat-admin.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadAll() {
    const supabase = window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    if (!supabase) return;
    const { data, error } = await supabase
      .from("Riwayat")
      .select("id,kode_user,nama_barang,jumlah_barang,total_biaya,modal_barang,harga_reguler,harga_premium,harga_kolektor")
      .order("id", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("Load admin gagal:", error);
      return;
    }
    rows = data || [];
    applyFilter();
  }

  document.addEventListener("DOMContentLoaded", function () {
    el("filterKode").addEventListener("input", applyFilter);
    el("filterNama").addEventListener("input", applyFilter);
    el("exportCsvBtn").addEventListener("click", exportCsv);
    loadAll();
  });
})();
