import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AdditionalInfoSectionProps {
  customerComment: string;
  installedBy: string;
  internalNotes: string;
  status: "draft" | "published";
  onCustomerCommentChange: (value: string) => void;
  onInstalledByChange: (value: string) => void;
  onInternalNotesChange: (value: string) => void;
  onStatusChange: (value: "draft" | "published") => void;
}

export const AdditionalInfoSection = ({
  customerComment,
  installedBy,
  internalNotes,
  status,
  onCustomerCommentChange,
  onInstalledByChange,
  onInternalNotesChange,
  onStatusChange,
}: AdditionalInfoSectionProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Zusätzliche Informationen</CardTitle>
          <CardDescription>
            Optional: Weitere Details zur Bewertung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Kundenstimme */}
          <div className="space-y-2">
            <Label htmlFor="customer_comment">Kundenstimme</Label>
            <Textarea
              id="customer_comment"
              placeholder="Zitat des Kunden zur Bewertung..."
              rows={5}
              value={customerComment}
              onChange={(e) => onCustomerCommentChange(e.target.value)}
            />
          </div>

          {/* Einbau durchgeführt von */}
          <div className="space-y-2">
            <Label htmlFor="installed_by">Einbau durchgeführt von</Label>
            <Input
              id="installed_by"
              placeholder="z.B. Montageteam Nord, Max Meier"
              value={installedBy}
              onChange={(e) => onInstalledByChange(e.target.value)}
            />
          </div>

          {/* Interne Notizen */}
          <div className="space-y-2">
            <Label htmlFor="internal_notes">Interne Notizen</Label>
            <Textarea
              id="internal_notes"
              placeholder="Nur für internen Gebrauch sichtbar..."
              rows={3}
              value={internalNotes}
              onChange={(e) => onInternalNotesChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nicht öffentlich sichtbar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Veröffentlichung</CardTitle>
          <CardDescription>
            Wählen Sie den Status der Bewertung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={status}
            onValueChange={(value) => onStatusChange(value as "draft" | "published")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft" className="cursor-pointer font-normal">
                Als Entwurf speichern
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="published" id="published" />
              <Label htmlFor="published" className="cursor-pointer font-normal">
                Sofort veröffentlichen
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </>
  );
};
