import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Plus, Edit, Trash2, Building2, AlertTriangle, Info } from "lucide-react";
import { Location } from "@/types/location";

const LocationsEditor = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [hasShowroom, setHasShowroom] = useState(true);
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [serviceAreas, setServiceAreas] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState("");
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const resetForm = () => {
    setName("");
    setIsActive(true);
    setIsDefault(false);
    setHasShowroom(true);
    setStreetAddress("");
    setPostalCode("");
    setCity("");
    setPhone("");
    setFax("");
    setEmail("");
    setDescription("");
    setServiceAreas("");
    setOpeningHours("");
    setGoogleMapsEmbedUrl("");
    setGoogleBusinessUrl("");
    setLogoUrl(null);
    setLogoFile(null);
    setPreviewUrl(null);
    setEditingId(null);
  };

  const openEditDialog = (location: Location) => {
    setEditingId(location.id);
    setName(location.name);
    setIsActive(location.is_active);
    setIsDefault(location.is_default);
    setHasShowroom(location.has_showroom);
    setStreetAddress(location.street_address);
    setPostalCode(location.postal_code);
    setCity(location.city);
    setPhone(location.phone || "");
    setFax(location.fax || "");
    setEmail(location.email);
    setDescription(location.description || "");
    setServiceAreas(location.service_areas || "");
    setOpeningHours(location.opening_hours || "");
    setGoogleMapsEmbedUrl(location.google_maps_embed_url || "");
    setGoogleBusinessUrl(location.google_business_url || "");
    setLogoUrl(location.logo_url);
    setPreviewUrl(null);
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Datei zu groß (max 2MB)");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setLogoFile(file);
  };

  const validateForm = () => {
    if (!name.trim()) {
      toast.error("Name ist erforderlich");
      return false;
    }
    if (!email.trim() || !email.includes("@der-kamindoktor.de")) {
      toast.error("E-Mail muss @der-kamindoktor.de enthalten");
      return false;
    }
    if (!postalCode.trim() || !/^\d{5}$/.test(postalCode)) {
      toast.error("PLZ muss 5-stellig sein");
      return false;
    }
    if (!streetAddress.trim() || !city.trim()) {
      toast.error("Adresse ist unvollständig");
      return false;
    }
    if (phone && !phone.startsWith("+49")) {
      toast.error("Telefon muss mit +49 beginnen");
      return false;
    }
    return true;
  };

  const saveLocation = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // 1. Upload Logo (falls neu)
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${name.toLowerCase().replace(/\s/g, "-")}.${fileExt}`;

        // Delete old logo if exists
        if (logoUrl) {
          const oldFileName = logoUrl.split("/").pop();
          if (oldFileName) {
            await supabase.storage.from("location-logos").remove([oldFileName]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from("location-logos")
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("location-logos").getPublicUrl(fileName);

        finalLogoUrl = publicUrl;
      }

      // 2. Location Data
      const locationData = {
        name: name.trim(),
        is_active: isActive,
        is_default: isDefault,
        has_showroom: hasShowroom,
        street_address: streetAddress.trim(),
        postal_code: postalCode.trim(),
        city: city.trim(),
        phone: phone.trim() || null,
        fax: fax.trim() || null,
        email: email.trim(),
        description: description.trim() || null,
        service_areas: serviceAreas.trim() || null,
        opening_hours: openingHours.trim() || null,
        google_maps_embed_url: googleMapsEmbedUrl.trim() || null,
        google_business_url: googleBusinessUrl.trim() || null,
        logo_url: finalLogoUrl,
      };

      if (editingId) {
        // UPDATE
        const { error } = await supabase
          .from("locations")
          .update(locationData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from("locations").insert(locationData);

        if (error) throw error;
      }

      // 3. Wenn is_default=true, setze alle anderen auf false
      if (isDefault) {
        await supabase
          .from("locations")
          .update({ is_default: false })
          .neq("id", editingId || "00000000-0000-0000-0000-000000000000");
      }

      toast.success(editingId ? "Standort aktualisiert" : "Standort erstellt");
      setDialogOpen(false);
      resetForm();
      loadLocations();
    } catch (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (location: Location) => {
    // Prüfe Review-Count
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("installed_by", location.name);

    setReviewCount(count || 0);
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      // DELETE Location
      const { error: deleteError } = await supabase
        .from("locations")
        .delete()
        .eq("id", locationToDelete.id);

      if (deleteError) throw deleteError;

      // UPDATE Reviews: Setze installed_by auf Default Location
      if (reviewCount > 0) {
        const { data: defaultLoc } = await supabase
          .from("locations")
          .select("name")
          .eq("is_default", true)
          .maybeSingle();

        if (defaultLoc) {
          await supabase
            .from("reviews")
            .update({ installed_by: defaultLoc.name })
            .eq("installed_by", locationToDelete.name);
        }
      }

      // Delete logo if exists
      if (locationToDelete.logo_url) {
        const fileName = locationToDelete.logo_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("location-logos").remove([fileName]);
        }
      }

      toast.success("Standort gelöscht");
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
      loadLocations();
    } catch (error) {
      toast.error("Löschen fehlgeschlagen");
      console.error(error);
    }
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
      {/* Header mit Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Standorte</h2>
          <p className="text-gray-400">Verwalte alle Standorte und Ausstellungsräume</p>
        </div>
        <Button onClick={openNewDialog} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Standort
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Logo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Adresse</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Kontakt</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Ausstellung</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Default</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {location.is_active ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-green-600">
                        <Check className="w-5 h-5 text-green-600 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-600">
                        <X className="w-5 h-5 text-red-600 stroke-[3]" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {location.logo_url ? (
                      <img
                        src={location.logo_url}
                        alt={`${location.name} Logo`}
                        className="w-10 h-10 object-contain bg-white rounded border border-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{location.name}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {location.street_address}
                    <br />
                    {location.postal_code} {location.city}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {location.phone && <div>{location.phone}</div>}
                    <div>{location.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {location.has_showroom ? (
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        Ja
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        Nein
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {location.is_default && (
                      <Badge className="bg-orange-500/20 text-orange-500 border-orange-500">
                        Hauptsitz
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                        onClick={() => openEditDialog(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-gray-700"
                        onClick={() => confirmDelete(location)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? "Standort bearbeiten" : "Neuer Standort"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Fülle alle erforderlichen Felder aus und speichere den Standort.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* A) GRUNDDATEN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Grunddaten</h3>
              <div>
                <Label className="text-gray-400">
                  Standort-Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Bamberg"
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label className="text-gray-400">Standort aktiv</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={hasShowroom} onCheckedChange={setHasShowroom} />
                  <Label className="text-gray-400">Hat Ausstellungsraum</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                  <Label className="text-gray-400">Ist Hauptsitz</Label>
                </div>
              </div>

              {isDefault && (
                <Alert className="bg-orange-500/10 border-orange-500">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-500">
                    Nur EIN Standort kann Hauptsitz sein. Andere werden automatisch deaktiviert.
                  </AlertDescription>
                </Alert>
              )}

              {!hasShowroom && (
                <Alert className="bg-blue-500/10 border-blue-500">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-500">
                    Montagestandort ohne Ausstellung
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* B) ADRESSE */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Adresse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-gray-400">
                    Straße & Hausnummer <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">
                    PLZ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    maxLength={5}
                    placeholder="12345"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">
                    Stadt <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
              </div>
            </div>

            {/* C) KONTAKT */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Kontakt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Telefon</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 ..."
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Fax</Label>
                  <Input
                    value={fax}
                    onChange={(e) => setFax(e.target.value)}
                    placeholder="+49 ..."
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-400">
                    E-Mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@der-kamindoktor.de"
                    className="bg-gray-800 border-gray-700 text-white mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Muss @der-kamindoktor.de enthalten</p>
                </div>
              </div>
            </div>

            {/* D) SEO & CONTENT */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">SEO & Content</h3>
              <div>
                <Label className="text-gray-400">Beschreibung</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Der Kamindoktor [Stadt] - Ihr Experte für..."
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Für Schema.org und Meta-Descriptions</p>
              </div>
              <div>
                <Label className="text-gray-400">Service-Gebiete</Label>
                <Textarea
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  placeholder="Stadt1, Stadt2, Stadt3"
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Komma-separiert</p>
              </div>
              <div>
                <Label className="text-gray-400">Öffnungszeiten</Label>
                <Textarea
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="Mo-Fr: 8-18 Uhr, Sa: 9-14 Uhr"
                  rows={2}
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Freitext</p>
              </div>
            </div>

            {/* E) GOOGLE INTEGRATION */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Google Integration</h3>
              <div>
                <Label className="text-gray-400">Google Maps Embed URL</Label>
                <Input
                  value={googleMapsEmbedUrl}
                  onChange={(e) => setGoogleMapsEmbedUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">iframe src URL von Google Maps</p>
              </div>
              <div>
                <Label className="text-gray-400">Google My Business URL</Label>
                <Input
                  value={googleBusinessUrl}
                  onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                  placeholder="https://g.page/..."
                  className="bg-gray-800 border-gray-700 text-white mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Link zum GMB Profil</p>
              </div>
            </div>

            {/* F) LOGO UPLOAD */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Logo</h3>

              {/* Preview */}
              {(logoUrl || previewUrl) && (
                <div className="flex items-center gap-4">
                  <img
                    src={previewUrl || logoUrl || ""}
                    alt="Logo Preview"
                    className="w-20 h-20 object-contain bg-white rounded border border-gray-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLogoUrl(null);
                      setPreviewUrl(null);
                      setLogoFile(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Entfernen
                  </Button>
                </div>
              )}

              {/* Upload */}
              <div>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoChange}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG oder SVG, max 2MB</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              Abbrechen
            </Button>
            <Button
              onClick={saveLocation}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? "Speichert..." : editingId ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {locationToDelete?.name} löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {reviewCount > 0 ? (
                <>
                  <strong className="text-orange-500">{reviewCount} Reviews</strong> sind diesem
                  Standort zugeordnet. Diese werden auf den Hauptsitz umgestellt.
                </>
              ) : (
                "Standort wird dauerhaft gelöscht."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-400 hover:text-white">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LocationsEditor;
