import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock } from "lucide-react";

interface AdditionalInfoSectionProps {
  customerComment: string;
  installedBy: string;
  internalNotes: string;
  status: "draft" | "published" | "pending";
  onCustomerCommentChange: (value: string) => void;
  onInstalledByChange: (value: string) => void;
  onInternalNotesChange: (value: string) => void;
  onStatusChange: (value: "draft" | "published" | "pending") => void;
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

          {/* Montagestandort */}
          <div className="space-y-2">
            <Label htmlFor="installed_by">Einbau durch Montage-Standort</Label>
            <Select
              value={installedBy || "none"}
              onValueChange={onInstalledByChange}
            >
              <SelectTrigger id="installed_by">
                <SelectValue placeholder="Bitte wählen (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nicht zugewiesen</SelectItem>
                <SelectItem value="Bamberg">Bamberg</SelectItem>
                <SelectItem value="Essen">Essen</SelectItem>
                <SelectItem value="Rödermark">Rödermark</SelectItem>
                <SelectItem value="Hamburg">Hamburg</SelectItem>
              </SelectContent>
            </Select>
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
            onValueChange={(value) => onStatusChange(value as "draft" | "published" | "pending")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="published" id="published" />
              <Label htmlFor="published" className="flex items-center gap-2 cursor-pointer font-normal">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-50">
                  <Check className="w-4 h-4 text-green-600 stroke-[3]" />
                </div>
                <span>Veröffentlicht</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="draft" id="draft" />
              <Label htmlFor="draft" className="flex items-center gap-2 cursor-pointer font-normal">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-50">
                  <X className="w-4 h-4 text-red-600 stroke-[3]" />
                </div>
                <span>Nicht veröffentlicht</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pending" id="pending" />
              <Label htmlFor="pending" className="flex items-center gap-2 cursor-pointer font-normal">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100">
                  <Clock className="w-4 h-4 text-gray-900 stroke-[2.5]" />
                </div>
                <span>Unbearbeitet</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </>
  );
};
