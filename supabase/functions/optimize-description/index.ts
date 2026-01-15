import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText, category, city } = await req.json();

    if (!rawText || rawText.trim() === "") {
      return new Response(
        JSON.stringify({ error: "rawText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Optimizing description for:", { category, city, rawTextLength: rawText.length });

    const systemPrompt = `Du bist ein SEO-Experte für Kaminbau und Ofenbau. Deine Aufgabe ist es, aus Stichpunkten einen professionellen, SEO-optimierten Fließtext zu erstellen.

Regeln:
- Schreibe einen natürlichen, gut lesbaren Fließtext (2-4 Sätze)
- Verwende relevante Suchbegriffe wie Kaminbau, Ofenbau, Kamin, Ofen, Heizung, etc. natürlich im Text
- Der Text soll informativ und professionell klingen
- Keine Übertreibungen oder Werbesprache
- Erwähne die Produktkategorie und den Standort falls sinnvoll
- Schreibe auf Deutsch
- Keine Aufzählungen oder Bulletpoints im Ergebnis
- Maximal 300 Zeichen`;

    const userPrompt = `Erstelle einen SEO-optimierten Beschreibungstext für folgendes Kaminbau-Projekt:

Produktkategorie: ${category || "Nicht angegeben"}
Standort: ${city || "Nicht angegeben"}

Stichpunkte vom Kunden:
${rawText}

Schreibe einen professionellen Fließtext:`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const optimizedText = data.choices?.[0]?.message?.content?.trim();

    if (!optimizedText) {
      throw new Error("No response from AI");
    }

    console.log("Generated text:", optimizedText.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({ optimizedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in optimize-description:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
