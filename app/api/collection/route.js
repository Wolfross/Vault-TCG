import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const db = supabaseAdmin();
  if (!db) return Response.json({ items: [] });
  const { data, error } = await db.from("collection").select("*").order("added_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ items: data });
}

export async function POST(request) {
  const body = await request.json();
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "DB not configured" }, { status: 503 });
  const { data, error } = await db.from("collection").insert(body).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
