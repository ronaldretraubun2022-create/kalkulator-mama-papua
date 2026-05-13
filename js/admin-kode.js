(function () {
  let rows = [];

  function el(id) {
    return document.getElementById(id);
  }

  async function loadKode() {
    const supabase = window.KalkulatorSupabase && window.KalkulatorSupabase.client;
    if (!supabase) return;
    const { data, error } = await supabase
      .from("KodeUser")
      .select("id,kode_user,nama_user,no_hp,lokasi,aktif,created_at")
      .order("id", { ascending: false });
    if (error) {
      console.error("Load kode gagal:", error);
      return;
    }
    rows = data || [];
    renderRows();
  }

  function renderRows() {
    const kodeQ = (el("searchKode").value || "").trim().toLowerCase();
    const namaQ = (el("searchNama").value || "").trim().toLowerCase();
    const lokasiQ = (el("searchLokasi").value || "").trim().toLowerCase();
    const filtered = rows.filter(function (r) {
      const kodeOk = !kodeQ || String(r.kode_user || "").toLowerCase().includes(kodeQ);
      const namaOk = !namaQ || String(r.nama_user || "").toLowerCase().includes(namaQ);
      const lokasiOk = !lokasiQ || String(r.lokasi || "").toLowerCase().includes(lokasiQ);
      return kodeOk && namaOk && lokasiOk;
    });

    el("kodeRows").innerHTML = filtered.map(function (r) {
      return `<tr class="border-t border-[#F2D479]/20">
        <td class="px-3 py-2">${r.kode_user || ""}</td>
        <td class="px-3 py-2">${r.nama_user || ""}</td>
        <td class="px-3 py-2">${r.no_hp || ""}</td>
        <td class="px-3 py-2">${r.lokasi || ""}</td>
        <td class="px-3 py-2">${r.aktif ? "Aktif" : "Nonaktif"}</td>
        <td class="px-3 py-2">
          <button data-edit="${r.id}" class="rounded-lg bg-mama-gold px-2 py-1 text-xs font-black text-black">Edit</button>
          <button data-toggle="${r.id}" class="rounded-lg bg-mama-green px-2 py-1 text-xs font-black text-[#fff7d6]">Toggle</button>
          <button data-del="${r.id}" class="rounded-lg bg-[#C44A3D] px-2 py-1 text-xs font-black text-[#fff7d6]">Hapus</button>
        </td>
      </tr>`;
    }).join("");
  }

  function generateKode() {
    const nums = rows
      .map(function (r) {
        const m = String(r.kode_user || "").match(/^MAMA-(\d{4})$/);
        return m ? Number(m[1]) : 0;
      })
      .filter(Boolean);
    const next = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
    el("kodeUser").value = `MAMA-${String(next).padStart(4, "0")}`;
  }

  async function saveKode() {
    const supabase = window.KalkulatorSupabase.client;
    const editingId = el("editingId").value;
    const payload = {
      kode_user: (el("kodeUser").value || "").trim().toUpperCase(),
      nama_user: (el("namaUser").value || "").trim(),
      no_hp: (el("noHp").value || "").trim(),
      lokasi: (el("lokasi").value || "").trim(),
      aktif: true,
    };
    if (!payload.kode_user) return;
    let error = null;
    if (editingId) {
      const res = await supabase.from("KodeUser").update({
        nama_user: payload.nama_user,
        no_hp: payload.no_hp,
        lokasi: payload.lokasi,
      }).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("KodeUser").insert([payload]);
      error = res.error;
    }
    if (error) {
      console.error("Simpan kode gagal:", error);
      return;
    }
    el("editingId").value = "";
    el("kodeUser").value = "";
    el("namaUser").value = "";
    el("noHp").value = "";
    el("lokasi").value = "";
    loadKode();
  }

  async function toggleAktif(id) {
    const row = rows.find(function (r) { return Number(r.id) === Number(id); });
    if (!row) return;
    await window.KalkulatorSupabase.client.from("KodeUser").update({ aktif: !row.aktif }).eq("id", id);
    loadKode();
  }

  async function hapusKode(id) {
    await window.KalkulatorSupabase.client.from("KodeUser").delete().eq("id", id);
    loadKode();
  }

  function bindTableActions() {
    el("kodeRows").addEventListener("click", function (event) {
      const editId = event.target.getAttribute("data-edit");
      const toggleId = event.target.getAttribute("data-toggle");
      const delId = event.target.getAttribute("data-del");
      if (editId) {
        const row = rows.find(function (r) { return String(r.id) === String(editId); });
        if (!row) return;
        el("editingId").value = String(row.id);
        el("kodeUser").value = row.kode_user || "";
        el("namaUser").value = row.nama_user || "";
        el("noHp").value = row.no_hp || "";
        el("lokasi").value = row.lokasi || "";
        return;
      }
      if (toggleId) {
        toggleAktif(toggleId);
        return;
      }
      if (delId) {
        hapusKode(delId);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    el("generateBtn").addEventListener("click", generateKode);
    el("saveBtn").addEventListener("click", saveKode);
    el("searchKode").addEventListener("input", renderRows);
    el("searchNama").addEventListener("input", renderRows);
    el("searchLokasi").addEventListener("input", renderRows);
    bindTableActions();
    loadKode();
  });
})();
