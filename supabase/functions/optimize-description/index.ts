import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const DEFAULT_PROMPT = `Du bist ein SEO-Experte für Kaminbau und Ofenbau. Erstelle aus den folgenden Stichpunkten einen professionellen, SEO-optimierten Fließtext (2-4 Sätze, max. 300 Zeichen).

Produktkategorie: {{category}}
Standort: {{city}}

Stichpunkte:
{{raw_text}}

WICHTIG: Antworte NUR mit dem fertigen Fließtext. Keine Einleitungen, keine Erklärungen, keine Anführungszeichen. Schreibe einen natürlichen, gut lesbaren Text ohne Aufzählungen.`;

// Common AI preambles to strip from output
const PREAMBLE_PATTERNS = [
  /^Hier ist ein professioneller,? SEO-optimierter Text[^:]*:\s*/i,
  /^Hier ist der (optimierte |SEO-)?Text[^:]*:\s*/i,
  /^Hier ist dein[^:]*:\s*/i,
  /^Der (optimierte |SEO-)?Text[^:]*:\s*/i,
  /^Professioneller Text[^:]*:\s*/i,
];

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

    // Load prompt template from database
    let promptTemplate = DEFAULT_PROMPT;
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: settings } = await supabase
        .from("seo_settings")
        .select("ai_description_prompt")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      if (settings?.ai_description_prompt) {
        promptTemplate = settings.ai_description_prompt;
        console.log("Using custom prompt from database");
      } else {
        console.log("Using default prompt");
      }
    }

    // Replace placeholders in template
    const userPrompt = promptTemplate
      .replace(/\{\{category\}\}/g, category || "Nicht angegeben")
      .replace(/\{\{city\}\}/g, city || "Nicht angegeben")
      .replace(/\{\{raw_text\}\}/g, rawText);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
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

    // Clean up AI preambles
    let cleanedText = optimizedText;
    for (const pattern of PREAMBLE_PATTERNS) {
      cleanedText = cleanedText.replace(pattern, '');
    }
    // Also remove leading/trailing quotes and whitespace
    cleanedText = cleanedText.replace(/^["„"'\s]+|["„"'\s]+$/g, '').trim();

    console.log("Generated text:", cleanedText.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({ optimizedText: cleanedText }),
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
