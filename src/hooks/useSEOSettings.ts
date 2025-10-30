import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SEOSettingsData {
  enable_indexing: boolean;
  canonical_base_url?: string;
}

export const useSEOSettings = () => {
  const [settings, setSettings] = useState<SEOSettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('seo_settings')
          .select('enable_indexing, canonical_base_url')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();

        if (error) throw error;
        setSettings(data);
      } catch (error) {
        console.error('Error loading SEO settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
};
