import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Sparkles, Info } from "lucide-react";
import { SEOSettings } from "@/types/seo-settings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISettingsEditorProps {
  settings: SEOSettings;
  onUpdate: (updates: Partial<SEOSettings>) => Promise<void>;
}

const DEFAULT_PROMPT = `Du bist ein SEO-Experte für Kaminbau und Ofenbau. Erstelle aus den folgenden Stichpunkten einen professionellen, SEO-optimierten Fließtext (2-4 Sätze, max. 300 Zeichen).

Produktkategorie: {{category}}
Standort: {{city}}

Stichpunkte:
{{raw_text}}

Schreibe einen natürlichen, gut lesbaren Text ohne Aufzählungen.`;

const PLACEHOLDERS = [
  { key: "{{category}}", description: "Produktkategorie (z.B. Kaminofen, Kaminkassette)" },
  { key: "{{city}}", description: "Stadt/Ort der Installation" },
  { key: "{{raw_text}}", description: "Stichpunkte vom Benutzer" },
];

const AISettingsEditor = ({ settings, onUpdate }: AISettingsEditorProps) => {
  const [prompt, setPrompt] = useState(settings.ai_description_prompt || DEFAULT_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setHasChanges(value !== (settings.ai_description_prompt || DEFAULT_PROMPT));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ ai_description_prompt: prompt } as any);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving AI settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
    setHasChanges(DEFAULT_PROMPT !== (settings.ai_description_prompt || DEFAULT_PROMPT));
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById("ai_prompt") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = prompt.substring(0, start) + placeholder + prompt.substring(end);
      setPrompt(newValue);
      setHasChanges(newValue !== (settings.ai_description_prompt || DEFAULT_PROMPT));
      
      // Set cursor position after placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <CardTitle>KI-Beschreibungs-Optimierung</CardTitle>
          </div>
          <CardDescription>
            Konfigurieren Sie den Prompt für die automatische SEO-Optimierung von Projektbeschreibungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder Info */}
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Verfügbare Platzhalter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((ph) => (
                <TooltipProvider key={ph.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
                        onClick={() => insertPlaceholder(ph.key)}
                      >
                        {ph.key}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ph.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Klicken zum Einfügen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="space-y-2">
            <Label htmlFor="ai_prompt">KI-Prompt Template</Label>
            <Textarea
              id="ai_prompt"
              value={prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Geben Sie hier den Prompt für die KI ein..."
            />
            <p className="text-xs text-muted-foreground">
              Dieser Prompt wird verwendet, um aus Stichpunkten SEO-optimierte Beschreibungen zu generieren.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Standard wiederherstellen
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Speichert..." : "Speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">So funktioniert es</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-400">
          <ol className="list-decimal list-inside space-y-2">
            <li>Beim Bearbeiten einer Bewertung gibt der Nutzer Stichpunkte ein</li>
            <li>Klick auf "KI-Vorschlag generieren" sendet die Daten an die KI</li>
            <li>Die KI verwendet diesen Prompt mit den eingesetzten Platzhaltern</li>
            <li>Der generierte Text kann übernommen und weiter bearbeitet werden</li>
            <li>Der finale Text wird auf der öffentlichen Bewertungsseite angezeigt</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettingsEditor;
