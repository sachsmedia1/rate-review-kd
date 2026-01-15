import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DescriptionSectionProps {
  descriptionRaw: string;
  descriptionSeo: string;
  productCategory: string;
  city: string;
  onDescriptionRawChange: (value: string) => void;
  onDescriptionSeoChange: (value: string) => void;
}

export const DescriptionSection = ({
  descriptionRaw,
  descriptionSeo,
  productCategory,
  city,
  onDescriptionRawChange,
  onDescriptionSeoChange,
}: DescriptionSectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const handleGenerateAI = async () => {
    if (!descriptionRaw.trim()) {
      toast.error("Bitte geben Sie zuerst Stichpunkte ein");
      return;
    }

    setIsGenerating(true);
    setAiSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke("optimize-description", {
        body: {
          rawText: descriptionRaw,
          category: productCategory,
          city: city,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.optimizedText) {
        setAiSuggestion(data.optimizedText);
        toast.success("KI-Vorschlag generiert!");
      } else {
        throw new Error("Keine Antwort vom KI-Service");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Fehler bei der KI-Generierung. Bitte versuchen Sie es erneut.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      onDescriptionSeoChange(aiSuggestion);
      setAiSuggestion(null);
      toast.success("Vorschlag übernommen!");
    }
  };

  const handleDiscardSuggestion = () => {
    setAiSuggestion(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projektbeschreibung</CardTitle>
        <CardDescription>
          Kurzbeschreibung für SEO-Optimierung (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Raw Input - Stichpunkte */}
        <div className="space-y-2">
          <Label htmlFor="description_raw">Stichpunkte / Kurzbeschreibung</Label>
          <Textarea
            id="description_raw"
            placeholder="Beschreiben Sie das Projekt in Stichpunkten, z.B.:&#10;- Kompletter Austausch des alten Kamineinsatzes&#10;- Modernes Design in Anthrazit&#10;- Dreiseitige Verglasung&#10;- 8 kW Heizleistung"
            rows={5}
            value={descriptionRaw}
            onChange={(e) => onDescriptionRawChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Geben Sie hier die wichtigsten Punkte zum Projekt ein
          </p>
        </div>

        {/* AI Generate Button */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateAI}
            disabled={isGenerating || !descriptionRaw.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                KI-Vorschlag generieren
              </>
            )}
          </Button>
          {descriptionSeo && !aiSuggestion && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGenerateAI}
              disabled={isGenerating || !descriptionRaw.trim()}
              className="gap-2 text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Neu generieren
            </Button>
          )}
        </div>

        {/* AI Suggestion Preview */}
        {aiSuggestion && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              KI-Vorschlag
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{aiSuggestion}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAcceptSuggestion}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Vorschlag übernehmen
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDiscardSuggestion}
              >
                Verwerfen
              </Button>
            </div>
          </div>
        )}

        {/* SEO Description - Editable after acceptance */}
        {(descriptionSeo || aiSuggestion === null) && (
          <div className="space-y-2">
            <Label htmlFor="description_seo">
              SEO-optimierte Beschreibung
              {descriptionSeo && <span className="ml-2 text-xs text-muted-foreground">(bearbeitbar)</span>}
            </Label>
            <Textarea
              id="description_seo"
              placeholder="Der optimierte Text erscheint hier nach der KI-Generierung..."
              rows={4}
              value={descriptionSeo}
              onChange={(e) => onDescriptionSeoChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Dieser Text wird auf der öffentlichen Bewertungsseite angezeigt
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
