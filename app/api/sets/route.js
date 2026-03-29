/**
 * /api/sets
 * Returns all PokÃ©mon TCG sets with their logo and symbol images.
 * Cached for 24 hours â€” set data rarely changes.
 */
export async function GET() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.POKEMON_TCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  }

  try {
    const res  = await fetch("https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=250", {
      headers,
      next: { revalidate: 86400 }, // cache 24 hours
    });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message, data: [] }, { status: 500 });
  }
}
