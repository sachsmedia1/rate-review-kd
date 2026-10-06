import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_review",
  title: "Bewertung abrufen",
  description: "Ruft eine einzelne Bewertung mit Details per ID oder Slug ab.",
  inputSchema: {
    id: z.string().optional().describe("UUID der Bewertung"),
    slug: z.string().optional().describe("URL-Slug der Bewertung"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, slug }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    if (!id && !slug) return { content: [{ type: "text", text: "id oder slug angeben" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("reviews")
      .select("id, slug, status, city, product_category, average_rating, customer_comment, description_seo, installation_date, before_image_url, after_image_url");
    q = id ? q.eq("id", id) : q.eq("slug", slug!);
    const { data, error } = await q.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Nicht gefunden" }], isError: true };
    const review = {
      id: data.id, slug: data.slug, status: data.status, city: data.city,
      product_category: data.product_category, average_rating: data.average_rating,
      customer_comment: data.customer_comment, description_seo: data.description_seo,
      installation_date: data.installation_date, before_image_url: data.before_image_url,
      after_image_url: data.after_image_url,
    };
    return { content: [{ type: "text", text: JSON.stringify(review) }], structuredContent: { review } };
  },
});
