import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldStaff } from "@/types/field-staff";

interface FieldStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: FieldStaff | null;
  onSave: (data: Partial<FieldStaff>) => Promise<void>;
}

export const FieldStaffDialog = ({ open, onOpenChange, staff, onSave }: FieldStaffDialogProps) => {
  const [formData, setFormData] = useState({
    area_name: "",
    area_number: null as number | null,
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    image_url: "",
    assigned_postal_codes: "",
    contact_form_url: "",
    is_active: true,
    display_order: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData({
        area_name: staff.area_name,
        area_number: staff.area_number,
        first_name: staff.first_name,
        last_name: staff.last_name,
        phone: staff.phone,
        email: staff.email,
        image_url: staff.image_url || "",
        assigned_postal_codes: staff.assigned_postal_codes.join(", "),
        contact_form_url: staff.contact_form_url || "",
        is_active: staff.is_active,
        display_order: staff.display_order,
      });
    } else {
      setFormData({
        area_name: "",
        area_number: null,
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        image_url: "",
        assigned_postal_codes: "",
        contact_form_url: "",
        is_active: true,
        display_order: 0,
      });
    }
    setErrors({});
  }, [staff, open]);

  const validatePostalCodes = (codes: string): boolean => {
    const codeArray = codes.split(",").map(c => c.trim()).filter(c => c);
    const plzRegex = /^(\d{2}|\d{2}-\d{2})$/;
    
    for (const code of codeArray) {
      if (!plzRegex.test(code)) {
        return false;
      }
    }
    return codeArray.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.area_name.trim()) {
      newErrors.area_name = "Bereichsname ist erforderlich";
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = "Vorname ist erforderlich";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Nachname ist erforderlich";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Telefonnummer ist erforderlich";
    }
    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }
    if (!formData.assigned_postal_codes.trim()) {
      newErrors.assigned_postal_codes = "PLZ-Bereiche sind erforderlich";
    } else if (!validatePostalCodes(formData.assigned_postal_codes)) {
      newErrors.assigned_postal_codes = "Ungültiges Format. Verwenden Sie: 01, 96, 06-09";
    }
    if (formData.area_number !== null && (formData.area_number < 1 || formData.area_number > 9)) {
      newErrors.area_number = "Bereichsnummer muss zwischen 1 und 9 liegen";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const postalCodesArray = formData.assigned_postal_codes
        .split(",")
        .map(c => c.trim())
        .filter(c => c);

      await onSave({
        area_name: formData.area_name.trim(),
        area_number: formData.area_number,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        image_url: formData.image_url.trim() || null,
        assigned_postal_codes: postalCodesArray,
        contact_form_url: formData.contact_form_url.trim() || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving field staff:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white border-gray-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {staff ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_name">
                Bereichsname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="area_name"
                value={formData.area_name}
                onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                placeholder="z.B. Bereich 1: Ost"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {errors.area_name && (
                <p className="text-sm text-red-500">{errors.area_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_number">Bereichsnummer (1-9)</Label>
              <Input
                id="area_number"
                type="number"
                min="1"
                max="9"
                value={formData.area_number || ""}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  area_number: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Optional"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {errors.area_number && (
                <p className="text-sm text-red-500">{errors.area_number}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Vorname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Vorname"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nachname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Nachname"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 170 1234567"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                E-Mail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@beispiel.de"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Profilbild URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://beispiel.de/bild.jpg"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_postal_codes">
              PLZ-Bereiche <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="assigned_postal_codes"
              value={formData.assigned_postal_codes}
              onChange={(e) => setFormData({ ...formData, assigned_postal_codes: e.target.value })}
              placeholder="01, 96, 06-09, 91-98"
              rows={3}
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">
              Kommagetrennt. Format: 01, 96 oder 06-09 für Bereiche
            </p>
            {errors.assigned_postal_codes && (
              <p className="text-sm text-red-500">{errors.assigned_postal_codes}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_form_url">Anfrage-URL</Label>
            <Input
              id="contact_form_url"
              type="url"
              value={formData.contact_form_url}
              onChange={(e) => setFormData({ ...formData, contact_form_url: e.target.value })}
              placeholder="https://beispiel.de/kontakt oder mailto:email@beispiel.de"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                className="border-gray-700"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Aktiv
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Sortierreihenfolge</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
