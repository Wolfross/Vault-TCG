/**
 * collection.js
 * Thin wrapper around collection storage.
 * - Uses localStorage in browser (works immediately, no setup)
 * - Falls back to Supabase when configured (persistent across devices)
 *
 * Each collection item:
 * {
 *   id:            string   (uuid)
 *   card_id:       string   (pokemontcg.io card ID, e.g. "base1-4")
 *   name:          string
 *   set_name:      string
 *   image_url:     string
 *   condition:     string   ("NM", "LP", "MP", "HP", "D")
 *   grade:         string   ("Raw", "PSA 9", "PSA 10", ...)
 *   print_variant: string   ("1st_edition", "shadowless", "unlimited", ...)
 *   language:      string   ("en", "jp", "other")
 *   quantity:      number
 *   purchase_price:number | null
 *   current_price: number
 *   flagged:       boolean  (variant not confirmed)
 *   notes:         string
 *   added_at:      string   (ISO date)
 * }
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
  const item = { ...card, id: uuid(), added_at: new Date().toISOString() };
  if (supabase) {
    const { data, error } = await supabase.from("collection").insert(item).select().single();
    if (!error) return data;
  }
  const items = readLocal();
  items.unshift(item);
  writeLocal(items);
  return item;
}

export async function updateCard(id, updates) {
  if (supabase) {
    const { data, error } = await supabase
      .from("collection").update(updates).eq("id", id).select().single();
    if (!error) return data;
  }
  const items = readLocal().map(i => i.id === id ? { ...i, ...updates } : i);
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
  const totalValue   = items.reduce((s, i) => s + (i.current_price || 0) * i.quantity, 0);
  const totalCost    = items.reduce((s, i) => s + (i.purchase_price || 0) * i.quantity, 0);
  const totalCards   = items.reduce((s, i) => s + i.quantity, 0);
  const gradedCards  = items.filter(i => i.grade !== "Raw").reduce((s, i) => s + i.quantity, 0);
  const flaggedCards = items.filter(i => i.flagged).length;
  return { totalValue, totalCost, totalCards, gradedCards, flaggedCards, items };
}
