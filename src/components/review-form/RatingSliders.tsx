import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingSlider = ({ label, value, onChange }: RatingSliderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base">{label}</Label>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="space-y-3">
        <Slider
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4, 5].map((flame) => (
            <Flame
              key={flame}
              className={cn(
                "h-6 w-6 transition-colors",
                flame <= value
                  ? "fill-primary text-primary"
                  : "fill-muted text-muted"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface RatingsSectionProps {
  ratings: {
    consultation: number;
    fire_safety: number;
    heating_performance: number;
    aesthetics: number;
    installation_quality: number;
    service: number;
  };
  onRatingChange: (key: string, value: number) => void;
}

export const RatingsSection = ({
  ratings,
  onRatingChange,
}: RatingsSectionProps) => {
  const averageRating = (
    (ratings.consultation +
      ratings.fire_safety +
      ratings.heating_performance +
      ratings.aesthetics +
      ratings.installation_quality +
      ratings.service) /
    6
  ).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bewertungen mit Flammen</CardTitle>
        <CardDescription>
          Bewerten Sie verschiedene Aspekte der Installation (1-5 Flammen)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RatingSlider
          label="Beratung"
          value={ratings.consultation}
          onChange={(val) => onRatingChange("consultation", val)}
        />
        <RatingSlider
          label="Gefahrenanalyse Brandsicherheit"
          value={ratings.fire_safety}
          onChange={(val) => onRatingChange("fire_safety", val)}
        />
        <RatingSlider
          label="Heizleistung"
          value={ratings.heating_performance}
          onChange={(val) => onRatingChange("heating_performance", val)}
        />
        <RatingSlider
          label="Optik"
          value={ratings.aesthetics}
          onChange={(val) => onRatingChange("aesthetics", val)}
        />
        <RatingSlider
          label="Professionalität bei der Montage"
          value={ratings.installation_quality}
          onChange={(val) => onRatingChange("installation_quality", val)}
        />
        <RatingSlider
          label="Service"
          value={ratings.service}
          onChange={(val) => onRatingChange("service", val)}
        />

        {/* Durchschnitt */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Flame className="h-8 w-8 fill-current" />
            <span className="text-2xl font-bold">
              Durchschnitt: {averageRating} Flammen
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
