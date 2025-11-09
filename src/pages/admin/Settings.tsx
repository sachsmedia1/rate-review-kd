import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOSettings, CategorySEOContent } from "@/types/seo-settings";
import CategorySEOEditor from "@/components/admin/CategorySEOEditor";
import CompanyInfoEditor from "@/components/admin/CompanyInfoEditor";
import LocationsEditor from "@/components/admin/LocationsEditor";
import { FieldStaffManagement } from "@/components/admin/FieldStaffManagement";

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

      if (error) throw error;

      // Parse the JSONB fields properly
      setSettings({
        ...data,
        category_seo_content: (data.category_seo_content || {}) as unknown as Record<string, CategorySEOContent>,
        service_areas: (data.service_areas || []) as unknown as string[],
        regional_keywords: (data.regional_keywords || []) as unknown as string[],
      } as SEOSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SEOSettings>) => {
    try {
      // Convert the updates to match Supabase types
      const supabaseUpdates = {
        ...updates,
        category_seo_content: updates.category_seo_content as any,
        service_areas: updates.service_areas as any,
        regional_keywords: updates.regional_keywords as any,
      };

      const { error } = await supabase
        .from('seo_settings')
        .update(supabaseUpdates)
        .eq('id', SETTINGS_ID);

      if (error) throw error;

      // Update local state
      setSettings(prev => prev ? { ...prev, ...updates } : null);

      toast({
        title: "Erfolgreich gespeichert",
        description: "Ihre Änderungen wurden gespeichert",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Fehler",
        description: "Änderungen konnten nicht gespeichert werden",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Einstellungen nicht gefunden</p>
            <Button onClick={() => navigate('/admin/dashboard')} variant="outline">
              Zurück zum Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>SEO-Einstellungen | Der Kamindoktor Admin</title>
        <meta name="description" content="SEO-Content und Unternehmensinformationen verwalten" />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/dashboard')}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Einstellungen</h1>
                  <p className="text-sm text-gray-400">SEO, Unternehmensdaten & Standorte</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800">
              <TabsTrigger value="categories" className="data-[state=active]:bg-orange-500">
                Kategorie-SEO
              </TabsTrigger>
              <TabsTrigger value="company" className="data-[state=active]:bg-orange-500">
                Unternehmensdaten
              </TabsTrigger>
              <TabsTrigger value="locations" className="data-[state=active]:bg-orange-500">
                Standorte
              </TabsTrigger>
              <TabsTrigger value="fieldstaff" className="data-[state=active]:bg-orange-500">
                Außendienst
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-6">
              <CategorySEOEditor 
                settings={settings} 
                onUpdate={updateSettings}
                onReload={loadSettings}
              />
            </TabsContent>

            <TabsContent value="company" className="space-y-6">
              <CompanyInfoEditor 
                settings={settings} 
                onUpdate={updateSettings}
                onReload={loadSettings}
              />
            </TabsContent>

            <TabsContent value="locations" className="space-y-6">
              <LocationsEditor />
            </TabsContent>

            <TabsContent value="fieldstaff" className="space-y-6">
              <FieldStaffManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Settings;
