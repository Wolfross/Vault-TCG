/**
 * /api/ebay?card=Charizard Base Set 4/102&condition=raw
 *
 * Returns real eBay SOLD listings for a card.
 * Uses eBay Browse API (completed sales).
 *
 * To get your free keys:
 *   1. Go to developer.ebay.com
 *   2. Create an app (takes 5 mins)
 *   3. Copy Client ID + Secret into .env
 */

let _ebayToken = null;
let _ebayTokenExpiry = 0;

async function getEbayToken() {
  if (_ebayToken && Date.now() < _ebayTokenExpiry) return _ebayToken;

  const clientId     = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  const data = await res.json();
  _ebayToken = data.access_token;
  _ebayTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _ebayToken;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const card      = searchParams.get("card")      || "";
  const condition = searchParams.get("condition") || "raw";

  const token = await getEbayToken();

  // No token = return mock data so UI still works during setup
  if (!token) {
    return Response.json({ source: "mock", items: getMockSales(card, condition) });
  }

  // Build search query
  let q = `${card} pokemon card`;
  if (condition.includes("PSA"))   q += ` PSA ${condition.split(" ")[1]}`;
  if (condition.includes("BGS"))   q += ` BGS ${condition.split(" ")[1]}`;

  try {
    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?` +
      `q=${encodeURIComponent(q)}&` +
      `filter=buyingOptions:{FIXED_PRICE|AUCTION},conditionIds:{3000|4000|1000},` +
      `itemEndDate:[${new Date(Date.now() - 30*24*60*60*1000).toISOString()}..${new Date().toISOString()}]&` +
      `sort=endTime&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
        next: { revalidate: 900 }, // cache 15 mins
      }
    );
    const data = await res.json();
    const items = (data.itemSummaries || []).map(item => ({
      id:        item.itemId,
      title:     item.title,
      price:     parseFloat(item.price?.value || 0),
      currency:  item.price?.currency || "USD",
      condition: item.condition,
      type:      item.buyingOptions?.includes("AUCTION") ? "Auction" : "BIN",
      bids:      item.bidCount || null,
      url:       item.itemWebUrl,
      image:     item.thumbnailImages?.[0]?.imageUrl || null,
      date:      item.itemEndDate || item.itemCreationDate,
    }));
    return Response.json({ source: "ebay", items });
  } catch (e) {
    return Response.json({ source: "mock", items: getMockSales(card, condition), error: e.message });
  }
}

function getMockSales(card, condition) {
  const base = condition.includes("PSA 10") ? 7400 :
               condition.includes("PSA 9")  ? 1750 :
               condition.includes("BGS")    ? 3300 : 410;
  return Array.from({ length: 8 }, (_, i) => ({
    id:        `mock-${i}`,
    title:     `${card} Pokemon Card ${condition} ${["NM", "EX", "NM/MT"][i % 3]}`,
    price:     Math.round(base * (0.85 + Math.random() * 0.3)),
    currency:  "USD",
    condition: condition === "raw" ? ["NM", "LP", "EX"][i % 3] : condition,
    type:      i % 3 === 0 ? "Auction" : "BIN",
    bids:      i % 3 === 0 ? Math.floor(Math.random() * 20) + 3 : null,
    url:       "https://ebay.com",
    image:     null,
    date:      new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
