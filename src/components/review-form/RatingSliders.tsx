import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isOptional?: boolean;
  isDisabled?: boolean;
  onOptionalToggle?: (checked: boolean) => void;
  ratingKey?: string;
}

const RatingSlider = ({ 
  label, 
  value, 
  onChange, 
  isOptional = false,
  isDisabled = false,
  onOptionalToggle,
  ratingKey
}: RatingSliderProps) => {
  return (
    <div className="space-y-2">
      {isOptional && (
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id={`optional-${ratingKey}`}
            checked={isDisabled}
            onCheckedChange={onOptionalToggle}
          />
          <label
            htmlFor={`optional-${ratingKey}`}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Nicht zutreffend für dieses Projekt
          </label>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label className={cn("text-base", isDisabled && "text-muted-foreground")}>
          {label}
        </Label>
        <span className={cn(
          "text-sm font-medium",
          isDisabled ? "text-muted-foreground" : "text-foreground"
        )}>
          {isDisabled ? '-' : value}
        </span>
      </div>
      <div className="space-y-3">
        <Slider
          value={[isDisabled ? 0 : value]}
          onValueChange={(vals) => !isDisabled && onChange(vals[0])}
          min={1}
          max={5}
          step={1}
          className="w-full"
          disabled={isDisabled}
        />
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4, 5].map((flame) => (
            <Flame
              key={flame}
              className={cn(
                "h-6 w-6 transition-colors",
                !isDisabled && flame <= value
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
  optionalRatings: {
    fire_safety: boolean;
    heating_performance: boolean;
  };
  onRatingChange: (key: string, value: number) => void;
  onOptionalToggle: (key: string, checked: boolean) => void;
}

export const RatingsSection = ({
  ratings,
  optionalRatings,
  onRatingChange,
  onOptionalToggle,
}: RatingsSectionProps) => {
  // Calculate average rating (only from active ratings)
  const activeRatings = [];
  if (ratings.consultation > 0) activeRatings.push(ratings.consultation);
  if (!optionalRatings.fire_safety && ratings.fire_safety > 0) activeRatings.push(ratings.fire_safety);
  if (!optionalRatings.heating_performance && ratings.heating_performance > 0) activeRatings.push(ratings.heating_performance);
  if (ratings.aesthetics > 0) activeRatings.push(ratings.aesthetics);
  if (ratings.installation_quality > 0) activeRatings.push(ratings.installation_quality);
  if (ratings.service > 0) activeRatings.push(ratings.service);

  const averageRating = activeRatings.length > 0
    ? (activeRatings.reduce((sum, val) => sum + val, 0) / activeRatings.length).toFixed(1)
    : "0.0";

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
          ratingKey="consultation"
        />
        <RatingSlider
          label="Gefahrenanalyse Brandsicherheit"
          value={ratings.fire_safety}
          onChange={(val) => onRatingChange("fire_safety", val)}
          isOptional={true}
          isDisabled={optionalRatings.fire_safety}
          onOptionalToggle={(checked) => onOptionalToggle("fire_safety", checked)}
          ratingKey="fire_safety"
        />
        <RatingSlider
          label="Heizleistung"
          value={ratings.heating_performance}
          onChange={(val) => onRatingChange("heating_performance", val)}
          isOptional={true}
          isDisabled={optionalRatings.heating_performance}
          onOptionalToggle={(checked) => onOptionalToggle("heating_performance", checked)}
          ratingKey="heating_performance"
        />
        <RatingSlider
          label="Optik"
          value={ratings.aesthetics}
          onChange={(val) => onRatingChange("aesthetics", val)}
          ratingKey="aesthetics"
        />
        <RatingSlider
          label="Professionalität bei der Montage"
          value={ratings.installation_quality}
          onChange={(val) => onRatingChange("installation_quality", val)}
          ratingKey="installation_quality"
        />
        <RatingSlider
          label="Service"
          value={ratings.service}
          onChange={(val) => onRatingChange("service", val)}
          ratingKey="service"
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
