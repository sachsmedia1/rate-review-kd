import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const PREAMBLE_PATTERNS = [
  /^Hier ist (ein|der|dein)[^:]*:\s*/i,
  /^Pinterest[- ]Titel[^:]*:\s*/i,
  /^Titel[^:]*:\s*/i,
  /^Vorschlag[^:]*:\s*/i,
];

const PROMPT = `Du bist ein Pinterest-Marketing-Experte für Kaminbau, Ofenbau und Wohndesign.
Erstelle EINEN ansprechenden Pinterest-Pin-Titel für folgende Vorher/Nachher-Verwandlung:

Produktkategorie: {{category}}
Stadt/Ort: {{city}}
Beschreibung: {{description}}

Anforderungen:
- Maximal 100 Zeichen (Pinterest-Limit)
- Emotional, einladend, weckt Neugier
- Enthält relevante Keywords für SEO
- Spricht Hauseigentümer & Wohnträumer an
- KEINE Hashtags, KEINE Emojis am Anfang
- Deutscher Text

WICHTIG: Antworte NUR mit dem fertigen Titel. Keine Einleitung, keine Anführungszeichen, keine Erklärung.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, city, description } = await req.json();

    if (!category || !city) {
      return new Response(
        JSON.stringify({ error: "category and city are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = PROMPT
      .replace(/\{\{category\}\}/g, category)
      .replace(/\{\{city\}\}/g, city)
      .replace(/\{\{description\}\}/g, (description || "").replace(/<[^>]*>/g, "").substring(0, 500));

    console.log("Generating Pinterest title for:", { category, city });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: userPrompt }],
        max_tokens: 200,
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit erreicht. Bitte später erneut versuchen." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte Credits aufladen." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let title: string = data.choices?.[0]?.message?.content?.trim() || "";

    if (!title) throw new Error("No response from AI");

    for (const pattern of PREAMBLE_PATTERNS) {
      title = title.replace(pattern, "");
    }
    title = title.replace(/^["„""'\s]+|["„""'\s]+$/g, "").trim();
    if (title.length > 100) title = title.substring(0, 97).trimEnd() + "...";

    console.log("Generated Pinterest title:", title);

    return new Response(
      JSON.stringify({ title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-pinterest-title:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});