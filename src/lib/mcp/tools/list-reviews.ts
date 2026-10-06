import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_reviews",
  title: "Bewertungen auflisten",
  description: "Listet die neuesten Kundenbewertungen, optional gefiltert nach Stadt, Kategorie oder Status.",
  inputSchema: {
    city: z.string().optional().describe("Stadt (Teilübereinstimmung)"),
    product_category: z.string().optional().describe("Produktkategorie, z.B. Kaminofen"),
    status: z.enum(["draft", "published", "pending"]).optional(),
    limit: z.number().int().min(1).max(100).optional().describe("Anzahl (Standard 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, product_category, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("reviews")
      .select("id, slug, status, city, product_category, average_rating, installation_date, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (city) q = q.ilike("city", `%${city}%`);
    if (product_category) q = q.eq("product_category", product_category);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const reviews = (data ?? []).map((r) => ({
      id: r.id, slug: r.slug, status: r.status, city: r.city,
      product_category: r.product_category, average_rating: r.average_rating,
      installation_date: r.installation_date, created_at: r.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(reviews) }], structuredContent: { reviews } };
  },
});
