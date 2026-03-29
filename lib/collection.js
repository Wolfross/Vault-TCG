/**
 * collection.js
 * Thin wrapper around collection storage.
 * - Uses localStorage in browser (works immediately, no setup)
 * - Uses Supabase when configured (persistent across devices)
 *
 * current_price: null means unpriced — never store 0 as a price.
 */
import { supabase } from "./supabase";

const LOCAL_KEY = "vault_collection";

function readLocal() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); }
  catch { return []; }
}

function writeLocal(items) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
}

function uuid() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

function sanitizeCard(card) {
  return {
    ...card,
    /* Never store 0 as current_price — use null to mean "unpriced" */
    current_price:  card.current_price  || null,
    purchase_price: card.purchase_price || null,
  };
}

/* ── Public API ── */

export async function getCollection() {
  if (supabase) {
    const { data, error } = await supabase
      .from("collection")
      .select("*")
      .order("added_at", { ascending: false });
    if (!error) return data;
  }
  return readLocal();
}

export async function addCard(card) {
  const item = {
    ...sanitizeCard(card),
    id:       uuid(),
    added_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase
      .from("collection").insert(item).select().single();
    if (!error) return data;
  }
  const items = readLocal();
  items.unshift(item);
  writeLocal(items);
  return item;
}

export async function updateCard(id, updates) {
  const sanitized = sanitizeCard(updates);
  if (supabase) {
    const { data, error } = await supabase
      .from("collection").update(sanitized).eq("id", id).select().single();
    if (!error) return data;
  }
  const items = readLocal().map(i => i.id === id ? { ...i, ...sanitized } : i);
  writeLocal(items);
  return items.find(i => i.id === id);
}

export async function removeCard(id) {
  if (supabase) {
    await supabase.from("collection").delete().eq("id", id);
    return;
  }
  writeLocal(readLocal().filter(i => i.id !== id));
}

export async function getStats() {
  const items = await getCollection();

  /* Only count cards that have a real price toward portfolio value */
  const pricedItems   = items.filter(i => i.current_price != null && i.current_price > 0);
  const unpricedItems = items.filter(i => !i.current_price);

  const totalValue   = pricedItems.reduce((s, i) => s + i.current_price * (i.quantity || 1), 0);
  const totalCost    = items.reduce((s, i) => s + (i.purchase_price || 0) * (i.quantity || 1), 0);
  const totalCards   = items.reduce((s, i) => s + (i.quantity || 1), 0);
  const gradedCards  = items.filter(i => i.grade && i.grade !== "Raw").reduce((s, i) => s + (i.quantity || 1), 0);
  const flaggedCards = items.filter(i => i.flagged).length;
  const unpricedCount = unpricedItems.length;

  /* Gainers / losers — only for cards with both prices */
  const withGain = pricedItems
    .filter(i => i.purchase_price)
    .map(i => ({ ...i, gain: i.current_price - i.purchase_price, gainPct: ((i.current_price - i.purchase_price) / i.purchase_price) * 100 }))
    .sort((a, b) => b.gainPct - a.gainPct);

  const topGainer = withGain[0] || null;
  const topLoser  = withGain[withGain.length - 1] || null;

  return {
    totalValue,
    totalCost,
    totalCards,
    gradedCards,
    flaggedCards,
    unpricedCount,
    topGainer,
    topLoser,
    items,
  };
}
