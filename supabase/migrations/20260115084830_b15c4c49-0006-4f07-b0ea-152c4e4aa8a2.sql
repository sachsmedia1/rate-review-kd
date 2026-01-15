-- Add AI prompt template column to seo_settings
ALTER TABLE public.seo_settings 
ADD COLUMN IF NOT EXISTS ai_description_prompt TEXT DEFAULT 'Du bist ein SEO-Experte für Kaminbau und Ofenbau. Erstelle aus den folgenden Stichpunkten einen professionellen, SEO-optimierten Fließtext (2-4 Sätze, max. 300 Zeichen).

Produktkategorie: {{category}}
Standort: {{city}}

Stichpunkte:
{{raw_text}}

Schreibe einen natürlichen, gut lesbaren Text ohne Aufzählungen.';

COMMENT ON COLUMN public.seo_settings.ai_description_prompt IS 'KI-Prompt-Template für die Beschreibungs-Optimierung. Platzhalter: {{category}}, {{city}}, {{raw_text}}';