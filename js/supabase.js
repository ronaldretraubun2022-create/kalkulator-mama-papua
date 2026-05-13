(function () {
  const SUPABASE_URL =
    "https://zamvftslzcfcxsrcjeni.supabase.co";

  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphbXZmdHNsemNmY3hzcmNqZW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjAwMDQsImV4cCI6MjA5NDIzNjAwNH0.ykzT1kGn2NqDCvsFQrLTHnKrMX7rqpktrqXcqF6RBlc";

  function createClientSafe() {
    try {
      if (!window.supabase) {
        console.error("Supabase CDN belum dimuat");
        return null;
      }

      const client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

      return client;
    } catch (error) {
      console.error("Init Supabase gagal:", error);
      return null;
    }
  }

  window.KalkulatorSupabase = {
    client: createClientSafe(),
    table: "Riwayat",
  };
})();