/**
 * /api/ebay?card=Charizard Base Set 4/102&condition=raw
 *
 * Uses eBay Finding API → findCompletedItems
 * This returns SOLD listings only — not active listings.
 * Active listings tell you what sellers hope to get.
 * Sold listings tell you what the market actually paid.
 *
 * API key needed: EBAY_CLIENT_ID (your App ID from developer.ebay.com)
 * No OAuth required — App ID is sufficient for Finding API.
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const card      = searchParams.get("card")      || "";
  const condition = searchParams.get("condition") || "raw";

  const appId = process.env.EBAY_CLIENT_ID;

  // No key = return mock data so UI still works during setup
  if (!appId) {
    return Response.json({ source: "mock", items: getMockSales(card, condition) });
  }

  // Build a tight search query
  // For graded cards include the grade in the query to filter noise
  let keywords = `${card} pokemon`;
  if (condition.includes("PSA"))  keywords += ` PSA ${condition.replace("PSA ", "")}`;
  if (condition.includes("BGS"))  keywords += ` BGS ${condition.replace("BGS ", "")}`;
  if (condition.includes("CGC"))  keywords += ` CGC ${condition.replace("CGC ", "")}`;

  // Build Finding API URL
  // findCompletedItems returns SOLD listings only when soldItemsOnly=true
  const params = new URLSearchParams({
    "OPERATION-NAME":          "findCompletedItems",
    "SERVICE-VERSION":         "1.0.0",
    "SECURITY-APPNAME":        appId,
    "RESPONSE-DATA-FORMAT":    "JSON",
    "REST-PAYLOAD":            "",
    "keywords":                keywords,
    "categoryId":              "2536",        // Pokémon category on eBay
    "itemFilter(0).name":      "SoldItemsOnly",
    "itemFilter(0).value":     "true",
    "itemFilter(1).name":      "Currency",
    "itemFilter(1).value":     "USD",
    "sortOrder":               "EndTimeSoonest",
    "paginationInput.entriesPerPage": "20",
    "outputSelector(0)":       "SellingStatus",
    "outputSelector(1)":       "PictureURLSuperSize",
  });

  const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;

  try {
    const res  = await fetch(url, { next: { revalidate: 900 } }); // cache 15 mins
    const data = await res.json();

    const root = data?.findCompletedItemsResponse?.[0];

    if (!root || root.ack?.[0] !== "Success") {
      console.error("eBay Finding API error:", JSON.stringify(root?.errorMessage || data));
      return Response.json({ source: "mock", items: getMockSales(card, condition), error: "eBay API error" });
    }

    const listings = root.searchResult?.[0]?.item || [];

    const items = listings
      .filter(item => {
        // Only include items that actually sold
        const sellingState = item.sellingStatus?.[0]?.sellingState?.[0];
        return sellingState === "EndedWithSales";
      })
      .map(item => {
        const soldPrice = parseFloat(
          item.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] || 0
        );
        const endTime   = item.listingInfo?.[0]?.endTime?.[0];
        const isAuction = item.listingInfo?.[0]?.listingType?.[0] === "Auction";
        const bids      = parseInt(item.sellingStatus?.[0]?.bidCount?.[0] || 0);

        return {
          id:        item.itemId?.[0],
          title:     item.title?.[0],
          price:     soldPrice,
          currency:  "USD",
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || condition,
          type:      isAuction ? "Auction" : "BIN",
          bids:      isAuction && bids > 0 ? bids : null,
          url:       item.viewItemURL?.[0],
          image:     item.galleryURL?.[0] || null,
          date:      endTime,
        };
      })
      .filter(item => item.price > 0) // strip any $0 anomalies
      .slice(0, 20);

    return Response.json({ source: "ebay", items });

  } catch (e) {
    console.error("eBay fetch error:", e.message);
    return Response.json({ source: "mock", items: getMockSales(card, condition), error: e.message });
  }
}

/* ── Mock data (used when no API key, or on error) ── */
function getMockSales(card, condition) {
  const base = condition.includes("PSA 10") ? 7400 :
               condition.includes("PSA 9")  ? 1750 :
               condition.includes("BGS 9.5")? 3300 :
               condition.includes("BGS 9")  ? 2200 :
               condition.includes("PSA 8")  ? 1050 :
               condition.includes("PSA 7")  ? 780  : 410;

  return Array.from({ length: 8 }, (_, i) => ({
    id:        `mock-${i}`,
    title:     `${card} Pokemon Card ${condition} ${["NM/MT","EX-MT","EX"][i % 3]}`,
    price:     Math.round(base * (0.85 + Math.random() * 0.3)),
    currency:  "USD",
    condition: condition === "raw" ? ["NM/MT","EX-MT","EX"][i % 3] : condition,
    type:      i % 3 === 0 ? "Auction" : "BIN",
    bids:      i % 3 === 0 ? Math.floor(Math.random() * 20) + 3 : null,
    url:       `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card + " " + condition)}&LH_Sold=1&LH_Complete=1`,
    image:     null,
    date:      new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
