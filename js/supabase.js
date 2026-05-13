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
    async getSession() {
      const client = this.client;
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data && data.session ? data.session : null;
    },
    async signIn(email, password) {
      const client = this.client;
      if (!client) throw new Error("Supabase belum siap");
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signUp(email, password) {
      const client = this.client;
      if (!client) throw new Error("Supabase belum siap");
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      const client = this.client;
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
  };
})();
