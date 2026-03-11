import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "";
    const page = url.searchParams.get("page") || "1";
    const perPage = url.searchParams.get("per_page") || "24";

    if (!query.trim()) {
      return new Response(JSON.stringify({ photos: [], total_results: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY") || "";
    if (!PEXELS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Pexels API key not configured", photos: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pexelsUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    const response = await fetch(pexelsUrl, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to search Pexels", photos: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
