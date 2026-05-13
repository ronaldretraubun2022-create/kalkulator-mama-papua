(function () {
  // Isi dengan kredensial project Supabase Anda.
  var SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
  var SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

  function createClientSafe() {
    try {
      if (!window.supabase || !window.supabase.createClient) return null;
      if (!SUPABASE_URL.includes("YOUR_PROJECT_REF")) {
        return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
      return null;
    } catch (error) {
      console.error("Init Supabase gagal:", error);
      return null;
    }
  }

  window.KalkulatorSupabase = {
    client: createClientSafe(),
    table: "transaksi",
  };
})();
