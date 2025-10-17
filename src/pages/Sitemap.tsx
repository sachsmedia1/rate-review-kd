import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sitemap = () => {
  const [xmlContent, setXmlContent] = useState('');

  useEffect(() => {
    generateSitemap();
  }, []);

  const generateSitemap = async () => {
    try {
      // Lade alle veröffentlichten Bewertungen
      const { data: reviews } = await supabase
        .from('reviews')
        .select('slug, installation_date, created_at')
        .eq('is_published', true)
        .order('installation_date', { ascending: false });

      if (!reviews) {
        console.error('Keine Bewertungen gefunden');
        return;
      }

      const baseUrl = window.location.origin;
      const today = new Date().toISOString().split('T')[0];

      // XML-Sitemap generieren
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Startseite
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';

      // Alle Bewertungs-Detailseiten
      reviews.forEach((review) => {
        const lastmod = review.installation_date || review.created_at || today;
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/bewertung/${review.slug}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });

      xml += '</urlset>';

      setXmlContent(xml);
    } catch (error) {
      console.error('Fehler beim Generieren der Sitemap:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {xmlContent || 'Sitemap wird generiert...'}
      </pre>
    </div>
  );
};

export default Sitemap;
