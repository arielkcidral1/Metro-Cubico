(function () {
  const SUPABASE_URL =
  "https://gprfrhzctjtmwbyyqwry.supabase.co";

  const SUPABASE_KEY =
  "sb_publishable_KxlABr4sz5SMnr9dzALZwg_lWUEUIIP";

  window.metroSupabase =
  window["supabase"].createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
})();
