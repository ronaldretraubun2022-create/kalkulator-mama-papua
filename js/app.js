(function () {
  const moneyFields = [
    "jumlahBarang",
    "ongkosBahan",
    "ongkosTransportasi",
    "jumlahOrang",
    "hariKerja",
    "jamKerjaPerHari",
    "upahPerOrang",
    "biayaKemasan",
    "biayaSewa",
    "biayaLain",
    "marginKeuntungan",
    "nilaiBudaya",
    "nilaiKolektor",
  ];

  let hasilTerakhir = null;
  let eventsBound = false;
  let hargaChart = null;
  let currentUserCode = "";
  let isSyncingOnline = false;

  function el(id) {
    return document.getElementById(id);
  }

  function parseNumber(id) {
    return KalkulatorUtils.parseAngka(el(id).value);
  }

  function readInput() {
    return {
      namaBarang: el("namaBarang").value.trim(),
      jumlahBarang: parseNumber("jumlahBarang"),
      ongkosBahan: parseNumber("ongkosBahan"),
      ongkosTransportasi: parseNumber("ongkosTransportasi"),
      jumlahOrang: parseNumber("jumlahOrang"),
      hariKerja: parseNumber("hariKerja"),
      jamKerjaPerHari: parseNumber("jamKerjaPerHari"),
      upahPerOrang: parseNumber("upahPerOrang"),
      biayaKemasan: parseNumber("biayaKemasan"),
      biayaSewa: parseNumber("biayaSewa"),
      biayaLain: parseNumber("biayaLain"),
      marginKeuntungan: parseNumber("marginKeuntungan"),
      nilaiBudaya: parseNumber("nilaiBudaya"),
      nilaiKolektor: parseNumber("nilaiKolektor"),
    };
  }

  function validate(data) {
    if (!data.namaBarang) return "Nama barang wajib diisi.";
    if (data.jumlahBarang <= 0) return "Jumlah barang jadi wajib lebih dari 0.";
    if (data.ongkosBahan <= 0) return "Ongkos bahan wajib lebih dari Rp 0.";
    return "";
  }

  function calculate(data) {
    const totalJamKerja = data.hariKerja * data.jamKerjaPerHari;
    const totalTenagaKerja =
      data.jumlahOrang * totalJamKerja * data.upahPerOrang;
    const totalBiayaProduksi =
      data.ongkosBahan +
      data.ongkosTransportasi +
      totalTenagaKerja +
      data.biayaKemasan +
      data.biayaSewa +
      data.biayaLain;
    const modalPerBarang =
      data.jumlahBarang > 0 ? totalBiayaProduksi / data.jumlahBarang : 0;
    const marginNominal = modalPerBarang * (data.marginKeuntungan / 100);
    const nilaiBudayaNominal = modalPerBarang * (data.nilaiBudaya / 100);
    const nilaiKolektorNominal =
      modalPerBarang * (data.nilaiKolektor / 100);
    const hargaReguler = Math.max(
      modalPerBarang,
      modalPerBarang * (1 + data.marginKeuntungan / 100),
    );
    const hargaPremium = Math.max(
      modalPerBarang,
      hargaReguler + nilaiBudayaNominal,
    );
    const hargaKolektor = Math.max(
      modalPerBarang,
      hargaPremium + nilaiKolektorNominal,
    );

    return {
      ...data,
      totalJamKerja,
      totalTenagaKerja,
      totalBiayaProduksi,
      modalPerBarang,
      marginNominal,
      nilaiBudayaNominal,
      nilaiKolektorNominal,
      hargaReguler,
      hargaPremium,
      hargaKolektor,
      updatedAt: new Date().toISOString(),
    };
  }

  function showError(message) {
    const box = el("formError");
    if (!message) {
      box.classList.add("hidden");
      box.textContent = "";
      return;
    }
    box.textContent = message;
    box.classList.remove("hidden");
  }

  function renderResult(result) {
    el("totalBiayaProduksi").textContent = KalkulatorUtils.formatRupiah(
      result.totalBiayaProduksi,
    );
    el("modalPerBarang").textContent = KalkulatorUtils.formatRupiah(
      result.modalPerBarang,
    );
    el("hargaReguler").textContent = KalkulatorUtils.formatRupiah(
      result.hargaReguler,
    );
    el("hargaPremium").textContent = KalkulatorUtils.formatRupiah(
      result.hargaPremium,
    );
    el("hargaKolektor").textContent = KalkulatorUtils.formatRupiah(
      result.hargaKolektor,
    );
    el("marginDisplay").textContent = `${result.marginKeuntungan}% (${KalkulatorUtils.formatRupiah(result.marginNominal)})`;
    el("budayaDisplay").textContent = `${result.nilaiBudaya}% (${KalkulatorUtils.formatRupiah(result.nilaiBudayaNominal)})`;
    el("penjelasan").innerHTML =
      `Mama menghitung <b>${KalkulatorUtils.safeText(result.namaBarang)}</b>. ` +
      `Total biaya produksi adalah <b>${KalkulatorUtils.formatRupiah(result.totalBiayaProduksi)}</b>, ` +
      `modal per barang <b>${KalkulatorUtils.formatRupiah(result.modalPerBarang)}</b> adalah batas bawah harga jual. ` +
      `Harga reguler memakai margin <b>${result.marginKeuntungan}%</b>, ` +
      `harga premium menambah nilai budaya <b>${result.nilaiBudaya}%</b>, ` +
      `dan harga kolektor menambah nilai kolektor <b>${result.nilaiKolektor}%</b>.`;
    renderChart(result);
  }

  function renderChart(result) {
    const canvas = el("hargaChart");
    if (!canvas || !window.Chart) return;

    if (hargaChart) {
      hargaChart.destroy();
      hargaChart = null;
    }

    hargaChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: ["Modal", "Reguler", "Premium", "Kolektor"],
        datasets: [
          {
            label: "Harga per Barang",
            data: [
              result.modalPerBarang,
              result.hargaReguler,
              result.hargaPremium,
              result.hargaKolektor,
            ],
            backgroundColor: ["#F2D479", "#6FAF4F", "#D97A2B", "#C44A3D"],
            borderRadius: 12,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#F2D479", font: { weight: "bold" } },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return KalkulatorUtils.formatRupiah(context.parsed.y || 0);
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#F2D479", font: { weight: "bold" } },
            grid: { color: "rgba(242,212,121,0.1)" },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#F2D479",
              callback: function (value) {
                return KalkulatorUtils.formatRupiah(value);
              },
            },
            grid: { color: "rgba(111,175,79,0.12)" },
          },
        },
      },
    });
  }

  function resetResult() {
    [
      "totalBiayaProduksi",
      "modalPerBarang",
      "hargaReguler",
      "hargaPremium",
      "hargaKolektor",
    ].forEach(function (id) {
      el(id).textContent = "Rp 0";
    });
    el("marginDisplay").textContent = "30%";
    el("budayaDisplay").textContent = "20%";
    el("penjelasan").textContent =
      "Isi data produk untuk melihat harga jual yang adil.";
    if (hargaChart) {
      hargaChart.destroy();
      hargaChart = null;
    }
  }

  function calculateAndSave(options) {
    const data = readInput();
    const error = validate(data);
    if (error) {
      if (options && options.showError) showError(error);
      return null;
    }

    showError("");
    hasilTerakhir = calculate(data);
    renderResult(hasilTerakhir);
    KalkulatorStorage.saveLastCalculation(hasilTerakhir);
    return hasilTerakhir;
  }

  function restoreData(data) {
    if (!data) return;
    const restoredData = {
      marginKeuntungan: 30,
      nilaiBudaya: 20,
      nilaiKolektor: 50,
      ...data,
    };
    [
      "namaBarang",
      "jumlahBarang",
      "ongkosBahan",
      "ongkosTransportasi",
      "jumlahOrang",
      "hariKerja",
      "jamKerjaPerHari",
      "upahPerOrang",
      "biayaKemasan",
      "biayaSewa",
      "biayaLain",
      "marginKeuntungan",
      "nilaiBudaya",
      "nilaiKolektor",
    ].forEach(function (id) {
      if (!el(id)) return;
      const value = restoredData[id] || "";
      el(id).value =
        id === "namaBarang" ? value : KalkulatorUtils.formatAngka(value);
    });
    hasilTerakhir = calculate(restoredData);
    renderResult(hasilTerakhir);
  }

  function resetForm() {
    el("calculatorForm").reset();
    el("marginKeuntungan").value = "30";
    el("nilaiBudaya").value = "20";
    el("nilaiKolektor").value = "50";
    hasilTerakhir = null;
    showError("");
    resetResult();
    KalkulatorStorage.clearLastCalculation();
    KalkulatorUtils.showToast("Form berhasil direset");
  }

  async function exportPDF() {
    let result = await KalkulatorStorage.readLatestTransaction();
    if (!result) {
      result = calculateAndSave({ showError: true });
    }
    if (!result) {
      KalkulatorUtils.showToast("Data belum ada untuk diexport");
      return;
    }
    const jsPdfLib = window.jspdf;
    if (!jsPdfLib || !jsPdfLib.jsPDF) {
      KalkulatorUtils.showToast("Library PDF belum siap");
      return;
    }

    const doc = new jsPdfLib.jsPDF({ unit: "pt", format: "a4" });
    const tanggal = new Date().toLocaleString("id-ID");
    const lines = [
      `Nama Barang: ${result.namaBarang || "-"}`,
      `Total Biaya: ${KalkulatorUtils.formatRupiah(result.totalBiayaProduksi)}`,
      `Modal per Barang: ${KalkulatorUtils.formatRupiah(result.modalPerBarang)}`,
      `Harga Reguler: ${KalkulatorUtils.formatRupiah(result.hargaReguler)}`,
      `Harga Premium: ${KalkulatorUtils.formatRupiah(result.hargaPremium)}`,
      `Harga Kolektor: ${KalkulatorUtils.formatRupiah(result.hargaKolektor)}`,
      `Tanggal: ${tanggal}`,
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Laporan Harga Ekraf", 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    lines.forEach(function (line, index) {
      doc.text(line, 40, 90 + index * 24);
    });

    doc.save("laporan-harga-ekraf.pdf");
    KalkulatorUtils.showToast("PDF berhasil dibuat");
  }

  async function simpanRiwayat() {
    const result = calculateAndSave({ showError: true });
    if (!result) {
      KalkulatorUtils.showToast("Gagal simpan: data belum lengkap");
      return;
    }
    try {
      const saveInfo = await KalkulatorStorage.saveTransaction(result);
      KalkulatorStorage.saveLastCalculation(result);
      if (saveInfo.source === "blocked_no_auth") {
        KalkulatorUtils.showToast("Masukkan Kode User dulu");
      } else if (saveInfo.source === "supabase") {
        KalkulatorUtils.showToast("Data tersimpan ke Supabase");
      } else if (saveInfo.source === "local_offline" || saveInfo.source === "local_fallback") {
        KalkulatorUtils.showToast("Offline: data disimpan lokal");
      } else {
        KalkulatorUtils.showToast("Data berhasil disimpan");
      }
    } catch (error) {
      console.error("Simpan transaksi gagal:", error);
      KalkulatorUtils.showToast("Gagal simpan data");
    }
  }

  function updateConnectionStatus(isOnline) {
    if (isOnline) {
      KalkulatorUtils.showToast("Online - data tersinkron");
    } else {
      KalkulatorUtils.showToast("Offline - data disimpan lokal");
    }
  }

  async function syncWhenOnline() {
    if (isSyncingOnline) return;
    isSyncingOnline = true;
    try {
      const result = await KalkulatorStorage.loadTransactionsHybrid();
      if (result && result.source === "supabase") {
        const latest = result.data && result.data.length ? result.data[0] : null;
        if (latest) {
          KalkulatorStorage.saveLastCalculation({
            ...KalkulatorStorage.readLastCalculation(),
            ...latest,
          });
        }
      }
    } catch (error) {
      console.error("Sync online gagal:", error);
    } finally {
      isSyncingOnline = false;
    }
  }

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;

    el("calculatorForm").addEventListener("submit", function (event) {
      event.preventDefault();
      const result = calculateAndSave({ showError: true });
      if (result) KalkulatorUtils.showToast("Harga berhasil dihitung");
    });
    const exportBtn = el("exportPdfBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        exportPDF();
      });
    }
    const resetBtn = el("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetForm);
    }
    el("namaBarang").addEventListener("input", function () {
      calculateAndSave();
    });
    moneyFields.forEach(function (id) {
      const input = el(id);
      if (!input) return;
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("pattern", "[0-9.]*");
      input.addEventListener("input", function () {
        this.value = KalkulatorUtils.formatAngka(this.value);
        calculateAndSave();
      });
      input.addEventListener("keypress", function (e) {
        if (!/[0-9]/.test(e.key)) {
          e.preventDefault();
        }
      });
      input.addEventListener("paste", function (e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text");
        this.value = KalkulatorUtils.formatAngka(text);
        calculateAndSave();
      });
    });
  }

  function updateAuthUI() {
    currentUserCode = KalkulatorStorage.readUserCode();
    el("authStatus").textContent = currentUserCode || "Belum Ada Kode";
    el("logoutBtn").classList.toggle("hidden", !currentUserCode);
    el("authOpenBtn").classList.toggle("hidden", !!currentUserCode);
  }

  async function reloadDataByActiveCode() {
    const activeCode = KalkulatorStorage.readUserCode();
    if (!activeCode) {
      hasilTerakhir = null;
      KalkulatorStorage.clearLastCalculation();
      resetResult();
      return;
    }
    const result = await KalkulatorStorage.loadTransactionsHybrid();
    const latest = result && result.data && result.data.length ? result.data[0] : null;
    if (latest) {
      KalkulatorStorage.saveLastCalculation(latest);
      restoreData(latest);
    } else {
      hasilTerakhir = null;
      KalkulatorStorage.clearLastCalculation();
      resetResult();
    }
  }

  async function initAuth() {
    const modal = el("authModal");
    const openBtn = el("authOpenBtn");
    const logoutBtn = el("logoutBtn");
    const loginBtn = el("loginBtn");
    const codeEl = el("authCode");
    updateAuthUI();

    openBtn.addEventListener("click", function () {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
    logoutBtn.addEventListener("click", function () {
      KalkulatorStorage.clearUserCode();
      updateAuthUI();
      hasilTerakhir = null;
      KalkulatorStorage.clearLastCalculation();
      resetResult();
      KalkulatorUtils.showToast("Logout berhasil");
    });
    loginBtn.addEventListener("click", function () {
      const code = (codeEl.value || "").trim().toUpperCase();
      if (!code) {
        KalkulatorUtils.showToast("Isi Kode User dulu");
        return;
      }
      window.KalkulatorSupabase.client
        .from("KodeUser")
        .select("kode_user,aktif")
        .eq("kode_user", code)
        .maybeSingle()
        .then(function (res) {
          if (res.error) {
            KalkulatorUtils.showToast("Validasi kode gagal");
            return;
          }
          if (!res.data || res.data.aktif === false) {
            KalkulatorUtils.showToast("Kode User tidak valid / nonaktif");
            return;
          }
          KalkulatorStorage.saveUserCode(code);
          updateAuthUI();
          hasilTerakhir = null;
          KalkulatorStorage.clearLastCalculation();
          resetResult();
          reloadDataByActiveCode();
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          KalkulatorUtils.showToast("Kode User aktif");
        });
    });
  }

  function hideSplash() {
    const splash = el("splashScreen");
    const app = el("mainApp");
    if (splash) {
      splash.classList.add("splash-out");
      window.setTimeout(function () {
        splash.style.display = "none";
      }, 350);
    }
    if (app) {
      app.classList.remove("opacity-0");
      app.classList.add("opacity-100");
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function (error) {
        console.log("Service Worker gagal:", error);
      });
    });
  }

  function bindNetworkEvents() {
    updateConnectionStatus(navigator.onLine);
    window.addEventListener("online", function () {
      updateConnectionStatus(true);
      syncWhenOnline();
    });
    window.addEventListener("offline", function () {
      updateConnectionStatus(false);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (window.lucide) {
        window.lucide.createIcons();
      }
      KalkulatorUtils.showToast("Memuat data transaksi...");
      bindEvents();
      initAuth();
      bindNetworkEvents();
      reloadDataByActiveCode().then(function () {
        const activeCode = KalkulatorStorage.readUserCode();
        if (!activeCode) {
          KalkulatorUtils.showToast("Masukkan Kode User untuk memuat riwayat");
        }
      });
      if (!hasilTerakhir) resetResult();
    } catch (error) {
      console.error("Init kalkulator gagal:", error);
    } finally {
      window.setTimeout(hideSplash, 1700);
    }
  });

  window.setTimeout(hideSplash, 2200);
  registerServiceWorker();
  window.exportPDF = function () {
    exportPDF();
  };
  window.simpanRiwayat = simpanRiwayat;
})();

