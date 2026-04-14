/**
 * /api/ebay?card=Charizard Base Set 4/102&condition=Raw
 *
 * Uses eBay Finding API → findCompletedItems with SoldItemsOnly=true
 * Results are cached in Supabase (ebay_price_cache table) for 24 hours
 * to avoid burning the daily rate limit on repeated page loads.
 */

import { supabase } from "@/lib/supabase";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const card = searchParams.get("card") || "";
  const condition = searchParams.get("condition") || "Raw";

  const appId = process.env.EBAY_CLIENT_ID;

  // Build cache key from card + condition
  const cacheKey = `${card}__${condition}`.toLowerCase().replace(/\s+/g, "_");

  // ── 1. Check Supabase cache first ──
  if (supabase) {
    try {
      const { data: cached } = await supabase
        .from("ebay_price_cache")
        .select("*")
        .eq("card_id", cacheKey)
        .single();

      if (cached) {
        const age = Date.now() - new Date(cached.fetched_at).getTime();
        if (age < CACHE_TTL_MS) {
          console.log(`[eBay cache] HIT for ${cacheKey} (${Math.round(age / 60000)}m old)`);
          return Response.json({
            source: "ebay",
            cached: true,
            items: cached.results,
            averagePrice: cached.average_price,
          });
        } else {
          console.log(`[eBay cache] STALE for ${cacheKey}, fetching fresh`);
        }
      } else {
        console.log(`[eBay cache] MISS for ${cacheKey}, fetching fresh`);
      }
    } catch (e) {
      console.error("[eBay cache] Read error:", e.message);
      // Don't block — fall through to live fetch
    }
  }

  // ── 2. No key = return mock data ──
  if (!appId) {
    return Response.json({ source: "mock", items: getMockSales(card, condition) });
  }

  // ── 3. Build eBay query ──
  let keywords = `${card} pokemon`;
  if (condition.includes("PSA")) keywords += ` PSA ${condition.replace("PSA ", "")}`;
  if (condition.includes("BGS")) keywords += ` BGS ${condition.replace("BGS ", "")}`;
  if (condition.includes("CGC")) keywords += ` CGC ${condition.replace("CGC ", "")}`;

  const params = new URLSearchParams({
    "OPERATION-NAME": "findCompletedItems",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "",
    "keywords": keywords,
    "categoryId": "2536",
    "itemFilter(0).name": "SoldItemsOnly",
    "itemFilter(0).value": "true",
    "itemFilter(1).name": "Currency",
    "itemFilter(1).value": "USD",
    "sortOrder": "EndTimeSoonest",
    "paginationInput.entriesPerPage": "20",
    "outputSelector(0)": "SellingStatus",
  });

  const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const root = data?.findCompletedItemsResponse?.[0];
    if (!root || root.ack?.[0] !== "Success") {
      const errDetail = JSON.stringify(root?.errorMessage || root || data);
      console.error("eBay Finding API error:", errDetail);
      return Response.json({ source: "mock", items: getMockSales(card, condition), error: errDetail });
    }

    const listings = root.searchResult?.[0]?.item || [];

    const items = listings
      .filter(item => {
        const sellingState = item.sellingStatus?.[0]?.sellingState?.[0];
        return sellingState === "EndedWithSales";
      })
      .map(item => {
        const soldPrice = parseFloat(
          item.sellingStatus?.[0]?.currentPrice?.[0]?.["__value__"] || 0
        );
        const endTime = item.listingInfo?.[0]?.endTime?.[0];
        const isAuction = item.listingInfo?.[0]?.listingType?.[0] === "Auction";
        const bids = parseInt(item.sellingStatus?.[0]?.bidCount?.[0] || 0);

        return {
          id: item.itemId?.[0],
          title: item.title?.[0],
          price: soldPrice,
          currency: "USD",
          condition: item.condition?.[0]?.conditionDisplayName?.[0] || condition,
          type: isAuction ? "Auction" : "BIN",
          bids: isAuction && bids > 0 ? bids : null,
          url: item.viewItemURL?.[0],
          image: item.galleryURL?.[0] || null,
          date: endTime,
        };
      })
      .filter(item => item.price > 0)
      .slice(0, 20);

    // ── 4. Calculate average price ──
    const averagePrice = items.length > 0
      ? Math.round((items.reduce((sum, i) => sum + i.price, 0) / items.length) * 100) / 100
      : null;

    // ── 5. Write to Supabase cache ──
    if (supabase && items.length > 0) {
      try {
        await supabase
          .from("ebay_price_cache")
          .upsert({
            card_id: cacheKey,
            card_name: card,
            results: items,
            average_price: averagePrice,
            fetched_at: new Date().toISOString(),
          }, { onConflict: "card_id" });
        console.log(`[eBay cache] Wrote ${items.length} items for ${cacheKey}`);
      } catch (e) {
        console.error("[eBay cache] Write error:", e.message);
        // Don't block — still return the results
      }
    }

    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(keywords)}&LH_Sold=1&LH_Complete=1&_sacat=2536`;

    return Response.json({ source: "ebay", cached: false, items, averagePrice, ebaySearchUrl });

  } catch (e) {
    console.error("eBay fetch error:", e.message);
    return Response.json({ source: "mock", items: getMockSales(card, condition), error: e.message });
  }
}

/* ── Mock data fallback ── */
function getMockSales(card, condition) {
  const base = condition.includes("PSA 10") ? 7400
    : condition.includes("PSA 9") ? 1750
    : condition.includes("BGS 9.5") ? 3300
    : condition.includes("BGS 9") ? 2200
    : condition.includes("PSA 8") ? 1050
    : condition.includes("PSA 7") ? 780
    : 410;

  const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(card + " pokemon")}&LH_Sold=1&LH_Complete=1&_sacat=2536`;

  return Array.from({ length: 8 }, (_, i) => ({
    id: `mock-${i}`,
    title: `${card} Pokemon Card ${condition} ${["NM/MT","EX-MT","EX"][i % 3]}`,
    price: Math.round(base * (0.85 + Math.random() * 0.3)),
    currency: "USD",
    condition: condition === "Raw" ? ["NM/MT","EX-MT","EX"][i % 3] : condition,
    type: i % 3 === 0 ? "Auction" : "BIN",
    bids: i % 3 === 0 ? Math.floor(Math.random() * 20) + 3 : null,
    url: searchUrl,
    image: null,
    date: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
