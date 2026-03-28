/**
 * /api/cards?q=name:charizard&set=base1&page=1&pageSize=20
 * Proxies Pokémon TCG API so the API key stays server-side.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q        = searchParams.get("q")        || "";
  const set      = searchParams.get("set")      || "";
  const page     = searchParams.get("page")     || "1";
  const pageSize = searchParams.get("pageSize") || "20";

  let query = q;
  if (set && !q) query = `set.id:${set}`;
  if (set && q)  query = `${q} set.id:${set}`;

  const url = new URL("https://api.pokemontcg.io/v2/cards");
  if (query)  url.searchParams.set("q", query);
  url.searchParams.set("page",     page);
  url.searchParams.set("pageSize", pageSize);
  url.searchParams.set("orderBy",  "number");

  const headers = { "Content-Type": "application/json" };
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }

  try {
    const res  = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Failed to fetch cards", detail: e.message }, { status: 500 });
  }
}
