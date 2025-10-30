import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEOSettings } from "@/types/seo-settings";

interface CompanyInfoEditorProps {
  settings: SEOSettings;
  onUpdate: (updates: Partial<SEOSettings>) => Promise<void>;
  onReload: () => Promise<void>;
}

const CompanyInfoEditor = ({ settings, onUpdate, onReload }: CompanyInfoEditorProps) => {
  const { toast } = useToast();
  const [companyData, setCompanyData] = useState({
    company_name: '',
    company_legal_name: '',
    company_description: '',
    company_founded_year: 2010,
    company_email: '',
    company_phone: '',
    company_website: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_region: '',
    social_facebook: '',
    social_instagram: '',
    social_linkedin: '',
    social_youtube: '',
    service_areas: [] as string[]
  });
  const [newServiceArea, setNewServiceArea] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    loadCompanyData();
  }, [settings]);

  const loadCompanyData = () => {
    setCompanyData({
      company_name: settings.company_name || '',
      company_legal_name: settings.company_legal_name || '',
      company_description: settings.company_description || '',
      company_founded_year: settings.company_founded_year || 2010,
      company_email: settings.company_email || '',
      company_phone: settings.company_phone || '',
      company_website: settings.company_website || '',
      address_street: settings.address_street || '',
      address_city: settings.address_city || '',
      address_postal_code: settings.address_postal_code || '',
      address_region: settings.address_region || '',
      social_facebook: settings.social_facebook || '',
      social_instagram: settings.social_instagram || '',
      social_linkedin: settings.social_linkedin || '',
      social_youtube: settings.social_youtube || '',
      service_areas: settings.service_areas || []
    });
    setHasUnsavedChanges(false);
  };

  const handleFieldChange = (field: keyof typeof companyData, value: string | number | string[]) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const addServiceArea = () => {
    if (newServiceArea.trim()) {
      setCompanyData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, newServiceArea.trim()]
      }));
      setNewServiceArea('');
      setHasUnsavedChanges(true);
    }
  };

  const removeServiceArea = (index: number) => {
    setCompanyData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  const saveCompanyData = async () => {
    try {
      setIsSaving(true);
      await onUpdate(companyData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving company data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetCompanyData = () => {
    loadCompanyData();
    toast({
      title: "Zurückgesetzt",
      description: "Änderungen wurden verworfen",
    });
  };

  const schemaOrgPreview = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": companyData.company_name,
    "legalName": companyData.company_legal_name,
    "description": companyData.company_description,
    "foundingDate": `${companyData.company_founded_year}-01-01`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": companyData.address_street,
      "addressLocality": companyData.address_city,
      "postalCode": companyData.address_postal_code,
      "addressRegion": companyData.address_region,
      "addressCountry": "DE"
    },
    "email": companyData.company_email,
    "telephone": companyData.company_phone,
    "url": companyData.company_website,
    "areaServed": companyData.service_areas,
    "sameAs": [
      companyData.social_facebook,
      companyData.social_instagram,
      companyData.social_linkedin,
      companyData.social_youtube
    ].filter(Boolean)
  };

  return (
    <div className="space-y-8">
      {/* Grundinformationen */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Grundinformationen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Firmenname</label>
            <Input
              value={companyData.company_name}
              onChange={(e) => handleFieldChange('company_name', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rechtlicher Name</label>
            <Input
              value={companyData.company_legal_name}
              onChange={(e) => handleFieldChange('company_legal_name', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gründungsjahr</label>
            <Input
              type="number"
              value={companyData.company_founded_year}
              onChange={(e) => handleFieldChange('company_founded_year', parseInt(e.target.value) || 2010)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <Input
              value={companyData.company_website}
              onChange={(e) => handleFieldChange('company_website', e.target.value)}
              placeholder="https://..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">E-Mail</label>
            <Input
              type="email"
              value={companyData.company_email}
              onChange={(e) => handleFieldChange('company_email', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Telefon</label>
            <Input
              value={companyData.company_phone}
              onChange={(e) => handleFieldChange('company_phone', e.target.value)}
              placeholder="+49 ..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Unternehmensbeschreibung</label>
          <Textarea
            value={companyData.company_description}
            onChange={(e) => handleFieldChange('company_description', e.target.value)}
            rows={4}
            placeholder="Der Kamindoktor ist Ihr Experte für..."
            className="bg-gray-800 border-gray-700 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Diese Beschreibung wird in Schema.org LocalBusiness verwendet
          </p>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Straße & Hausnummer</label>
            <Input
              value={companyData.address_street}
              onChange={(e) => handleFieldChange('address_street', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stadt</label>
            <Input
              value={companyData.address_city}
              onChange={(e) => handleFieldChange('address_city', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">PLZ</label>
            <Input
              value={companyData.address_postal_code}
              onChange={(e) => handleFieldChange('address_postal_code', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Region/Bundesland</label>
            <Input
              value={companyData.address_region}
              onChange={(e) => handleFieldChange('address_region', e.target.value)}
              placeholder="Bayern"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Facebook</label>
            <Input
              value={companyData.social_facebook}
              onChange={(e) => handleFieldChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instagram</label>
            <Input
              value={companyData.social_instagram}
              onChange={(e) => handleFieldChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn</label>
            <Input
              value={companyData.social_linkedin}
              onChange={(e) => handleFieldChange('social_linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">YouTube</label>
            <Input
              value={companyData.social_youtube}
              onChange={(e) => handleFieldChange('social_youtube', e.target.value)}
              placeholder="https://youtube.com/@..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Service-Gebiete */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Service-Gebiete</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {companyData.service_areas.map((area, index) => (
            <span 
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-sm"
            >
              {area}
              <button
                onClick={() => removeServiceArea(index)}
                className="hover:text-orange-400"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newServiceArea}
            onChange={(e) => setNewServiceArea(e.target.value)}
            placeholder="Stadt/Region hinzufügen..."
            className="bg-gray-800 border-gray-700 text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addServiceArea();
              }
            }}
          />
          <Button onClick={addServiceArea} variant="outline" className="border-gray-700">
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Diese Städte werden in Schema.org areaServed verwendet
        </p>
      </div>

      {/* Schema.org Preview */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Schema.org Vorschau</h3>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <pre className="text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(schemaOrgPreview, null, 2)}
          </pre>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Dieses JSON-LD wird auf jeder Seite eingebettet für bessere SEO
        </p>
      </div>

      {/* Save Actions */}
      <div className="flex gap-3 pt-6 border-t border-gray-800">
        <Button 
          onClick={saveCompanyData} 
          disabled={!hasUnsavedChanges || isSaving}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isSaving ? "Wird gespeichert..." : "💾 Änderungen speichern"}
        </Button>
        <Button 
          variant="outline" 
          onClick={resetCompanyData}
          disabled={!hasUnsavedChanges || isSaving}
          className="border-gray-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Zurücksetzen
        </Button>
      </div>

      {hasUnsavedChanges && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
          <p className="text-sm text-yellow-500">
            ⚠️ Sie haben ungespeicherte Änderungen
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyInfoEditor;
