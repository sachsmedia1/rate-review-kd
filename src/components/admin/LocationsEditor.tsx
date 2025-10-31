import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Building2, Phone, Mail, Globe, Save } from "lucide-react";

interface Location {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  has_showroom: boolean;
  street_address: string;
  postal_code: string;
  city: string;
  phone: string | null;
  fax: string | null;
  email: string;
  description: string | null;
  service_areas: string | null;
  opening_hours: string | null;
  google_maps_embed_url: string | null;
  google_business_url: string | null;
  logo_url: string | null;
}

const LocationsEditor = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");

    if (error) {
      toast.error("Fehler beim Laden der Standorte");
      console.error(error);
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  const handleUpdate = async (locationId: string, field: string, value: any) => {
    setSaving(locationId);

    // Wenn is_default auf true gesetzt wird, alle anderen auf false setzen
    if (field === "is_default" && value === true) {
      await supabase
        .from("locations")
        .update({ is_default: false })
        .neq("id", locationId);
    }

    const { error } = await supabase
      .from("locations")
      .update({ [field]: value })
      .eq("id", locationId);

    if (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } else {
      toast.success("Standort aktualisiert");
      loadLocations();
    }

    setSaving(null);
  };

  const handleSaveAll = async (location: Location) => {
    setSaving(location.id);

    const { error } = await supabase
      .from("locations")
      .update({
        street_address: location.street_address,
        postal_code: location.postal_code,
        city: location.city,
        phone: location.phone,
        fax: location.fax,
        email: location.email,
        description: location.description,
        service_areas: location.service_areas,
        opening_hours: location.opening_hours,
        google_maps_embed_url: location.google_maps_embed_url,
        google_business_url: location.google_business_url,
      })
      .eq("id", location.id);

    if (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } else {
      toast.success(`${location.name} gespeichert`);
    }

    setSaving(null);
  };

  const updateLocalLocation = (locationId: string, field: string, value: any) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId ? { ...loc, [field]: value } : loc
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {locations.map((location) => (
        <Card key={location.id} className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-orange-500" />
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {location.name}
                    {location.is_default && (
                      <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-1 rounded">
                        Hauptsitz
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {location.city} • {location.has_showroom ? "Mit Ausstellung" : "Nur Montage"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={location.is_active}
                    onCheckedChange={(checked) =>
                      handleUpdate(location.id, "is_active", checked)
                    }
                  />
                  <Label className="text-sm text-gray-400">Aktiv</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={location.has_showroom}
                    onCheckedChange={(checked) =>
                      handleUpdate(location.id, "has_showroom", checked)
                    }
                  />
                  <Label className="text-sm text-gray-400">Ausstellung</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={location.is_default}
                    onCheckedChange={(checked) =>
                      handleUpdate(location.id, "is_default", checked)
                    }
                  />
                  <Label className="text-sm text-gray-400">Hauptsitz</Label>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Adresse */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Straße & Hausnummer
                </Label>
                <Input
                  value={location.street_address}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "street_address", e.target.value)
                  }
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-400">PLZ</Label>
                <Input
                  value={location.postal_code}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "postal_code", e.target.value)
                  }
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-400">Stadt</Label>
                <Input
                  value={location.city}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "city", e.target.value)
                  }
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
            </div>

            {/* Kontakt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefon
                </Label>
                <Input
                  value={location.phone || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "phone", e.target.value)
                  }
                  placeholder="Optional"
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-400">Fax</Label>
                <Input
                  value={location.fax || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "fax", e.target.value)
                  }
                  placeholder="Optional"
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-Mail
                </Label>
                <Input
                  type="email"
                  value={location.email}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "email", e.target.value)
                  }
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
            </div>

            {/* Beschreibung & Service Areas */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Beschreibung (SEO)</Label>
                <Textarea
                  value={location.description || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "description", e.target.value)
                  }
                  rows={3}
                  placeholder="SEO-optimierte Standortbeschreibung"
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-400">Servicegebiete</Label>
                <Textarea
                  value={location.service_areas || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "service_areas", e.target.value)
                  }
                  rows={2}
                  placeholder="z.B. Bamberg, Forchheim, Bayreuth, Coburg"
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-400">Öffnungszeiten</Label>
                <Textarea
                  value={location.opening_hours || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "opening_hours", e.target.value)
                  }
                  rows={2}
                  placeholder="z.B. Mo-Fr: 8-18 Uhr, Sa: 9-14 Uhr"
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
            </div>

            {/* Google Integration */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Google Maps Embed URL
                </Label>
                <Input
                  value={location.google_maps_embed_url || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "google_maps_embed_url", e.target.value)
                  }
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-400">Google Business URL</Label>
                <Input
                  value={location.google_business_url || ""}
                  onChange={(e) =>
                    updateLocalLocation(location.id, "google_business_url", e.target.value)
                  }
                  placeholder="https://g.page/..."
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => handleSaveAll(location)}
                disabled={saving === location.id}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving === location.id ? "Speichert..." : "Änderungen speichern"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LocationsEditor;
