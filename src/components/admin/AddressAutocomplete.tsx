import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface AddressData {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  defaultValue?: string;
}

export const AddressAutocomplete = ({ 
  onAddressSelect, 
  defaultValue 
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsLoading(false);
        clearInterval(checkGoogleMaps);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkGoogleMaps);
      if (!window.google) {
        console.error("Google Maps API failed to load");
        setIsLoading(false);
      }
    }, 5000);

    return () => clearInterval(checkGoogleMaps);
  }, []);

  useEffect(() => {
    if (!inputRef.current || !window.google || isLoading) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "de" },
      fields: ["address_components", "geometry", "formatted_address"],
      types: ["address"],
    });

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place?.address_components || !place?.geometry) {
        console.warn("No valid place selected");
        return;
      }

      let street = "";
      let houseNumber = "";
      let postalCode = "";
      let city = "";

      for (const component of place.address_components) {
        if (component.types.includes("route")) street = component.long_name;
        if (component.types.includes("street_number")) houseNumber = component.long_name;
        if (component.types.includes("postal_code")) postalCode = component.long_name;
        if (component.types.includes("locality")) city = component.long_name;
      }

      const latitude = place.geometry.location?.lat() || 0;
      const longitude = place.geometry.location?.lng() || 0;

      console.log("✅ Google Places Autocomplete:", { street, houseNumber, postalCode, city, latitude, longitude });

      setInputValue(place.formatted_address || "");
      onAddressSelect({ street, houseNumber, postalCode, city, latitude, longitude });
    });
  }, [onAddressSelect, isLoading]);

  return (
    <div className="space-y-2">
      <Label htmlFor="address-autocomplete" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Adresse suchen
        <span className="text-muted-foreground font-normal">(schnellere Eingabe)</span>
      </Label>
      <Input
        id="address-autocomplete"
        ref={inputRef}
        type="text"
        placeholder={isLoading ? "Google Maps lädt..." : "z.B. Bamberg, Litzendorf, Hauptstraße..."}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        disabled={isLoading}
      />
      <p className="text-xs text-muted-foreground">
        💡 Wählen Sie eine Adresse aus den Vorschlägen, um alle Felder automatisch auszufüllen
      </p>
    </div>
  );
};
